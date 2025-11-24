import { IDependencyDirectionDetector } from "../../domain/services/IDependencyDirectionDetector"
import { DependencyViolation } from "../../domain/value-objects/DependencyViolation"
import { LAYERS } from "../../shared/constants/rules"

/**
 * Detects dependency direction violations between architectural layers
 *
 * This detector enforces Clean Architecture dependency rules:
 * - Domain → should not import from Application or Infrastructure
 * - Application → should not import from Infrastructure
 * - Infrastructure → can import from Application and Domain (allowed)
 * - Shared → can be imported by all layers (allowed)
 *
 * @example
 * ```typescript
 * const detector = new DependencyDirectionDetector()
 *
 * // Detect violations in domain file
 * const code = `
 * import { PrismaClient } from '@prisma/client'
 * import { UserDto } from '../application/dtos/UserDto'
 * `
 * const violations = detector.detectViolations(code, 'src/domain/entities/User.ts', 'domain')
 *
 * // violations will contain 1 violation for domain importing from application
 * console.log(violations.length) // 1
 * console.log(violations[0].getMessage())
 * // "Domain layer should not import from Application layer"
 * ```
 */
export class DependencyDirectionDetector implements IDependencyDirectionDetector {
    private readonly dependencyRules: Map<string, Set<string>>

    constructor() {
        this.dependencyRules = new Map([
            [LAYERS.DOMAIN, new Set([LAYERS.DOMAIN, LAYERS.SHARED])],
            [LAYERS.APPLICATION, new Set([LAYERS.DOMAIN, LAYERS.APPLICATION, LAYERS.SHARED])],
            [
                LAYERS.INFRASTRUCTURE,
                new Set([LAYERS.DOMAIN, LAYERS.APPLICATION, LAYERS.INFRASTRUCTURE, LAYERS.SHARED]),
            ],
            [
                LAYERS.SHARED,
                new Set([LAYERS.DOMAIN, LAYERS.APPLICATION, LAYERS.INFRASTRUCTURE, LAYERS.SHARED]),
            ],
        ])
    }

    /**
     * Detects dependency direction violations in the given code
     *
     * Analyzes import statements to identify violations of dependency rules
     * between architectural layers.
     *
     * @param code - Source code to analyze
     * @param filePath - Path to the file being analyzed
     * @param layer - The architectural layer of the file (domain, application, infrastructure, shared)
     * @returns Array of detected dependency direction violations
     */
    public detectViolations(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): DependencyViolation[] {
        if (!layer || layer === LAYERS.SHARED) {
            return []
        }

        const violations: DependencyViolation[] = []
        const lines = code.split("\n")

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lineNumber = i + 1

            const imports = this.extractImports(line)
            for (const importPath of imports) {
                const targetLayer = this.extractLayerFromImport(importPath)

                if (targetLayer && this.isViolation(layer, targetLayer)) {
                    violations.push(
                        DependencyViolation.create(
                            layer,
                            targetLayer,
                            importPath,
                            filePath,
                            lineNumber,
                        ),
                    )
                }
            }
        }

        return violations
    }

    /**
     * Checks if an import violates dependency direction rules
     *
     * @param fromLayer - The layer that is importing
     * @param toLayer - The layer being imported
     * @returns True if the import violates dependency rules
     */
    public isViolation(fromLayer: string, toLayer: string): boolean {
        const allowedDependencies = this.dependencyRules.get(fromLayer)

        if (!allowedDependencies) {
            return false
        }

        return !allowedDependencies.has(toLayer)
    }

    /**
     * Extracts the layer from an import path
     *
     * @param importPath - The import path to analyze
     * @returns The layer name if detected, undefined otherwise
     */
    public extractLayerFromImport(importPath: string): string | undefined {
        const normalizedPath = importPath.replace(/['"]/g, "").toLowerCase()

        const layerPatterns: Array<[string, string]> = [
            [LAYERS.DOMAIN, "/domain/"],
            [LAYERS.APPLICATION, "/application/"],
            [LAYERS.INFRASTRUCTURE, "/infrastructure/"],
            [LAYERS.SHARED, "/shared/"],
        ]

        for (const [layer, pattern] of layerPatterns) {
            if (this.containsLayerPattern(normalizedPath, pattern)) {
                return layer
            }
        }

        return undefined
    }

    /**
     * Checks if the normalized path contains the layer pattern
     */
    private containsLayerPattern(normalizedPath: string, pattern: string): boolean {
        return (
            normalizedPath.includes(pattern) ||
            normalizedPath.includes(`.${pattern}`) ||
            normalizedPath.includes(`..${pattern}`) ||
            normalizedPath.includes(`...${pattern}`)
        )
    }

    /**
     * Extracts import paths from a line of code
     *
     * Handles various import statement formats:
     * - import { X } from 'path'
     * - import X from 'path'
     * - import * as X from 'path'
     * - const X = require('path')
     *
     * @param line - A line of code to analyze
     * @returns Array of import paths found in the line
     */
    private extractImports(line: string): string[] {
        const imports: string[] = []

        const esImportRegex =
            /import\s+(?:{[^}]*}|[\w*]+(?:\s+as\s+\w+)?|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g
        let match = esImportRegex.exec(line)
        while (match) {
            imports.push(match[1])
            match = esImportRegex.exec(line)
        }

        const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
        match = requireRegex.exec(line)
        while (match) {
            imports.push(match[1])
            match = requireRegex.exec(line)
        }

        return imports
    }
}
