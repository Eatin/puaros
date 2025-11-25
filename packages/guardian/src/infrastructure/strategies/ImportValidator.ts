import { IMPORT_PATTERNS } from "../constants/paths"
import { AggregatePathAnalyzer } from "./AggregatePathAnalyzer"
import { FolderRegistry } from "./FolderRegistry"

/**
 * Validates imports for aggregate boundary violations
 *
 * Checks if imports cross aggregate boundaries inappropriately
 * and ensures proper encapsulation in DDD architecture.
 */
export class ImportValidator {
    constructor(
        private readonly folderRegistry: FolderRegistry,
        private readonly pathAnalyzer: AggregatePathAnalyzer,
    ) {}

    /**
     * Checks if an import violates aggregate boundaries
     */
    public isViolation(importPath: string, currentAggregate: string): boolean {
        const normalizedPath = this.normalizeImportPath(importPath)

        if (!this.isValidImportPath(normalizedPath)) {
            return false
        }

        if (this.isInternalBoundedContextImport(normalizedPath)) {
            return false
        }

        const targetAggregate = this.pathAnalyzer.extractAggregateFromImport(normalizedPath)
        if (!targetAggregate || targetAggregate === currentAggregate) {
            return false
        }

        if (this.isAllowedImport(normalizedPath)) {
            return false
        }

        return this.seemsLikeEntityImport(normalizedPath)
    }

    /**
     * Extracts all import paths from a line of code
     */
    public extractImports(line: string): string[] {
        const imports: string[] = []

        this.extractEsImports(line, imports)
        this.extractRequireImports(line, imports)

        return imports
    }

    /**
     * Normalizes an import path for consistent processing
     */
    private normalizeImportPath(importPath: string): string {
        return importPath.replace(IMPORT_PATTERNS.QUOTE, "").toLowerCase()
    }

    /**
     * Checks if import path is valid for analysis
     */
    private isValidImportPath(normalizedPath: string): boolean {
        if (!normalizedPath.includes("/")) {
            return false
        }

        if (!normalizedPath.startsWith(".") && !normalizedPath.startsWith("/")) {
            return false
        }

        return true
    }

    /**
     * Checks if import is internal to the same bounded context
     */
    private isInternalBoundedContextImport(normalizedPath: string): boolean {
        const parts = normalizedPath.split("/")
        const dotDotCount = parts.filter((p) => p === "..").length

        if (dotDotCount === 1) {
            const nonDotParts = parts.filter((p) => p !== ".." && p !== ".")
            if (nonDotParts.length >= 1) {
                const firstFolder = nonDotParts[0]
                if (this.folderRegistry.isEntityFolder(firstFolder)) {
                    return true
                }
            }
        }

        return false
    }

    /**
     * Checks if import is from an allowed folder
     */
    private isAllowedImport(normalizedPath: string): boolean {
        for (const folderName of this.folderRegistry.allowedFolders) {
            if (normalizedPath.includes(`/${folderName}/`)) {
                return true
            }
        }
        return false
    }

    /**
     * Checks if import seems to be an entity
     */
    private seemsLikeEntityImport(normalizedPath: string): boolean {
        const pathParts = normalizedPath.split("/")
        const lastPart = pathParts[pathParts.length - 1]

        if (!lastPart) {
            return false
        }

        const filename = lastPart.replace(/\.(ts|js)$/, "")

        if (filename.length > 0 && /^[a-z][a-z]/.exec(filename)) {
            return true
        }

        return false
    }

    /**
     * Extracts ES6 imports from a line
     */
    private extractEsImports(line: string, imports: string[]): void {
        let match = IMPORT_PATTERNS.ES_IMPORT.exec(line)
        while (match) {
            imports.push(match[1])
            match = IMPORT_PATTERNS.ES_IMPORT.exec(line)
        }
    }

    /**
     * Extracts CommonJS requires from a line
     */
    private extractRequireImports(line: string, imports: string[]): void {
        let match = IMPORT_PATTERNS.REQUIRE.exec(line)
        while (match) {
            imports.push(match[1])
            match = IMPORT_PATTERNS.REQUIRE.exec(line)
        }
    }
}
