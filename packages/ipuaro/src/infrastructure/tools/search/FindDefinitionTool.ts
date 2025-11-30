import { promises as fs } from "node:fs"
import * as path from "node:path"
import type { ITool, ToolContext, ToolParameterSchema } from "../../../domain/services/ITool.js"
import type { SymbolLocation } from "../../../domain/services/IStorage.js"
import {
    createErrorResult,
    createSuccessResult,
    type ToolResult,
} from "../../../domain/value-objects/ToolResult.js"

/**
 * A single definition location with context.
 */
export interface DefinitionLocation {
    path: string
    line: number
    type: SymbolLocation["type"]
    context: string
}

/**
 * Result data from find_definition tool.
 */
export interface FindDefinitionResult {
    symbol: string
    found: boolean
    definitions: DefinitionLocation[]
    suggestions?: string[]
}

/**
 * Tool for finding where a symbol is defined.
 * Uses the SymbolIndex to locate definitions.
 */
export class FindDefinitionTool implements ITool {
    readonly name = "find_definition"
    readonly description =
        "Find where a symbol is defined. " + "Returns file path, line number, and symbol type."
    readonly parameters: ToolParameterSchema[] = [
        {
            name: "symbol",
            type: "string",
            description: "Symbol name to find definition for",
            required: true,
        },
    ]
    readonly requiresConfirmation = false
    readonly category = "search" as const

    private readonly contextLines = 2

    validateParams(params: Record<string, unknown>): string | null {
        if (typeof params.symbol !== "string" || params.symbol.trim() === "") {
            return "Parameter 'symbol' is required and must be a non-empty string"
        }

        return null
    }

    async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        const startTime = Date.now()
        const callId = `${this.name}-${String(startTime)}`

        const symbol = (params.symbol as string).trim()

        try {
            const symbolIndex = await ctx.storage.getSymbolIndex()
            const locations = symbolIndex.get(symbol)

            if (!locations || locations.length === 0) {
                const suggestions = this.findSimilarSymbols(symbol, symbolIndex)
                return createSuccessResult(
                    callId,
                    {
                        symbol,
                        found: false,
                        definitions: [],
                        suggestions: suggestions.length > 0 ? suggestions : undefined,
                    } satisfies FindDefinitionResult,
                    Date.now() - startTime,
                )
            }

            const definitions: DefinitionLocation[] = []
            for (const loc of locations) {
                const context = await this.getContext(loc, ctx)
                definitions.push({
                    path: loc.path,
                    line: loc.line,
                    type: loc.type,
                    context,
                })
            }

            definitions.sort((a, b) => {
                const pathCompare = a.path.localeCompare(b.path)
                if (pathCompare !== 0) {
                    return pathCompare
                }
                return a.line - b.line
            })

            const result: FindDefinitionResult = {
                symbol,
                found: true,
                definitions,
            }

            return createSuccessResult(callId, result, Date.now() - startTime)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return createErrorResult(callId, message, Date.now() - startTime)
        }
    }

    /**
     * Get context lines around the definition.
     */
    private async getContext(loc: SymbolLocation, ctx: ToolContext): Promise<string> {
        try {
            const lines = await this.getFileLines(loc.path, ctx)
            if (lines.length === 0) {
                return ""
            }

            const lineIndex = loc.line - 1
            const startIndex = Math.max(0, lineIndex - this.contextLines)
            const endIndex = Math.min(lines.length - 1, lineIndex + this.contextLines)

            const contextLines: string[] = []
            for (let i = startIndex; i <= endIndex; i++) {
                const lineNum = i + 1
                const prefix = i === lineIndex ? ">" : " "
                contextLines.push(`${prefix}${String(lineNum).padStart(4)}│${lines[i]}`)
            }

            return contextLines.join("\n")
        } catch {
            return ""
        }
    }

    /**
     * Get file lines from storage or filesystem.
     */
    private async getFileLines(relativePath: string, ctx: ToolContext): Promise<string[]> {
        const fileData = await ctx.storage.getFile(relativePath)
        if (fileData) {
            return fileData.lines
        }

        const absolutePath = path.resolve(ctx.projectRoot, relativePath)
        try {
            const content = await fs.readFile(absolutePath, "utf-8")
            return content.split("\n")
        } catch {
            return []
        }
    }

    /**
     * Find similar symbol names for suggestions.
     */
    private findSimilarSymbols(symbol: string, symbolIndex: Map<string, unknown>): string[] {
        const suggestions: string[] = []
        const lowerSymbol = symbol.toLowerCase()
        const maxSuggestions = 5

        for (const name of symbolIndex.keys()) {
            if (suggestions.length >= maxSuggestions) {
                break
            }

            const lowerName = name.toLowerCase()
            if (lowerName.includes(lowerSymbol) || lowerSymbol.includes(lowerName)) {
                suggestions.push(name)
            } else if (this.levenshteinDistance(lowerSymbol, lowerName) <= 2) {
                suggestions.push(name)
            }
        }

        return suggestions.sort()
    }

    /**
     * Calculate Levenshtein distance between two strings.
     */
    private levenshteinDistance(a: string, b: string): number {
        if (a.length === 0) {
            return b.length
        }
        if (b.length === 0) {
            return a.length
        }

        const matrix: number[][] = []

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i]
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1]
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1,
                    )
                }
            }
        }

        return matrix[b.length][a.length]
    }
}
