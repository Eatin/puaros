import * as path from "node:path"
import type { ITool, ToolContext, ToolParameterSchema } from "../../../domain/services/ITool.js"
import {
    createErrorResult,
    createSuccessResult,
    type ToolResult,
} from "../../../domain/value-objects/ToolResult.js"

/**
 * A single reference to a symbol.
 */
export interface SymbolReference {
    path: string
    line: number
    column: number
    context: string
    isDefinition: boolean
}

/**
 * Result data from find_references tool.
 */
export interface FindReferencesResult {
    symbol: string
    totalReferences: number
    files: number
    references: SymbolReference[]
    definitionLocations: {
        path: string
        line: number
        type: string
    }[]
}

/**
 * Tool for finding all usages of a symbol across the codebase.
 * Searches through indexed files for symbol references.
 */
export class FindReferencesTool implements ITool {
    readonly name = "find_references"
    readonly description =
        "Find all usages of a symbol across the codebase. " +
        "Returns list of file paths, line numbers, and context."
    readonly parameters: ToolParameterSchema[] = [
        {
            name: "symbol",
            type: "string",
            description: "Symbol name to search for (function, class, variable, etc.)",
            required: true,
        },
        {
            name: "path",
            type: "string",
            description: "Limit search to specific file or directory",
            required: false,
        },
    ]
    readonly requiresConfirmation = false
    readonly category = "search" as const

    private readonly contextLines = 1

    validateParams(params: Record<string, unknown>): string | null {
        if (typeof params.symbol !== "string" || params.symbol.trim() === "") {
            return "Parameter 'symbol' is required and must be a non-empty string"
        }

        if (params.path !== undefined && typeof params.path !== "string") {
            return "Parameter 'path' must be a string"
        }

        return null
    }

    async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        const startTime = Date.now()
        const callId = `${this.name}-${String(startTime)}`

        const symbol = (params.symbol as string).trim()
        const filterPath = params.path as string | undefined

        try {
            const symbolIndex = await ctx.storage.getSymbolIndex()
            const definitionLocations = symbolIndex.get(symbol) ?? []

            const allFiles = await ctx.storage.getAllFiles()
            const filesToSearch = this.filterFiles(allFiles, filterPath, ctx.projectRoot)

            if (filesToSearch.size === 0) {
                return createSuccessResult(
                    callId,
                    {
                        symbol,
                        totalReferences: 0,
                        files: 0,
                        references: [],
                        definitionLocations: definitionLocations.map((loc) => ({
                            path: loc.path,
                            line: loc.line,
                            type: loc.type,
                        })),
                    } satisfies FindReferencesResult,
                    Date.now() - startTime,
                )
            }

            const references: SymbolReference[] = []
            const filesWithReferences = new Set<string>()

            for (const [filePath, fileData] of filesToSearch) {
                const fileRefs = this.findReferencesInFile(
                    filePath,
                    fileData.lines,
                    symbol,
                    definitionLocations,
                )

                if (fileRefs.length > 0) {
                    filesWithReferences.add(filePath)
                    references.push(...fileRefs)
                }
            }

            references.sort((a, b) => {
                const pathCompare = a.path.localeCompare(b.path)
                if (pathCompare !== 0) {
                    return pathCompare
                }
                return a.line - b.line
            })

            const result: FindReferencesResult = {
                symbol,
                totalReferences: references.length,
                files: filesWithReferences.size,
                references,
                definitionLocations: definitionLocations.map((loc) => ({
                    path: loc.path,
                    line: loc.line,
                    type: loc.type,
                })),
            }

            return createSuccessResult(callId, result, Date.now() - startTime)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return createErrorResult(callId, message, Date.now() - startTime)
        }
    }

    /**
     * Filter files by path prefix if specified.
     */
    private filterFiles(
        allFiles: Map<string, { lines: string[] }>,
        filterPath: string | undefined,
        projectRoot: string,
    ): Map<string, { lines: string[] }> {
        if (!filterPath) {
            return allFiles
        }

        const normalizedFilter = filterPath.startsWith("/")
            ? path.relative(projectRoot, filterPath)
            : filterPath

        const filtered = new Map<string, { lines: string[] }>()
        for (const [filePath, fileData] of allFiles) {
            if (filePath === normalizedFilter || filePath.startsWith(`${normalizedFilter}/`)) {
                filtered.set(filePath, fileData)
            }
        }

        return filtered
    }

    /**
     * Find all references to the symbol in a file.
     */
    private findReferencesInFile(
        filePath: string,
        lines: string[],
        symbol: string,
        definitionLocations: { path: string; line: number }[],
    ): SymbolReference[] {
        const references: SymbolReference[] = []
        const symbolRegex = this.createSymbolRegex(symbol)

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex]
            const lineNumber = lineIndex + 1
            let match: RegExpExecArray | null

            symbolRegex.lastIndex = 0
            while ((match = symbolRegex.exec(line)) !== null) {
                const column = match.index + 1
                const context = this.buildContext(lines, lineIndex)
                const isDefinition = this.isDefinitionLine(
                    filePath,
                    lineNumber,
                    definitionLocations,
                )

                references.push({
                    path: filePath,
                    line: lineNumber,
                    column,
                    context,
                    isDefinition,
                })
            }
        }

        return references
    }

    /**
     * Create a regex for matching the symbol with appropriate boundaries.
     * Handles symbols that start or end with non-word characters (like $value).
     */
    private createSymbolRegex(symbol: string): RegExp {
        const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

        const startsWithWordChar = /^\w/.test(symbol)
        const endsWithWordChar = /\w$/.test(symbol)

        const prefix = startsWithWordChar ? "\\b" : "(?<![\\w$])"
        const suffix = endsWithWordChar ? "\\b" : "(?![\\w$])"

        return new RegExp(`${prefix}${escaped}${suffix}`, "g")
    }

    /**
     * Build context string with surrounding lines.
     */
    private buildContext(lines: string[], currentIndex: number): string {
        const startIndex = Math.max(0, currentIndex - this.contextLines)
        const endIndex = Math.min(lines.length - 1, currentIndex + this.contextLines)

        const contextLines: string[] = []
        for (let i = startIndex; i <= endIndex; i++) {
            const lineNum = i + 1
            const prefix = i === currentIndex ? ">" : " "
            contextLines.push(`${prefix}${String(lineNum).padStart(4)}│${lines[i]}`)
        }

        return contextLines.join("\n")
    }

    /**
     * Check if this line is a definition location.
     */
    private isDefinitionLine(
        filePath: string,
        lineNumber: number,
        definitionLocations: { path: string; line: number }[],
    ): boolean {
        return definitionLocations.some((loc) => loc.path === filePath && loc.line === lineNumber)
    }
}
