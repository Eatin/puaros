import { IAggregateBoundaryDetector } from "../../domain/services/IAggregateBoundaryDetector"
import { AggregateBoundaryViolation } from "../../domain/value-objects/AggregateBoundaryViolation"
import { LAYERS } from "../../shared/constants/rules"
import { AggregatePathAnalyzer } from "../strategies/AggregatePathAnalyzer"
import { FolderRegistry } from "../strategies/FolderRegistry"
import { ImportValidator } from "../strategies/ImportValidator"

/**
 * Detects aggregate boundary violations in Domain-Driven Design
 *
 * This detector enforces DDD aggregate rules:
 * - Aggregates should reference each other only by ID or Value Objects
 * - Direct entity references across aggregates create tight coupling
 * - Each aggregate should be independently modifiable
 *
 * Folder structure patterns detected:
 * - domain/aggregates/order/Order.ts
 * - domain/order/Order.ts (aggregate name from parent folder)
 * - domain/entities/order/Order.ts
 *
 * @example
 * ```typescript
 * const detector = new AggregateBoundaryDetector()
 *
 * // Detect violations in order aggregate
 * const code = `
 * import { User } from '../user/User'
 * import { UserId } from '../user/value-objects/UserId'
 * `
 * const violations = detector.detectViolations(
 *     code,
 *     'src/domain/aggregates/order/Order.ts',
 *     'domain'
 * )
 *
 * // violations will contain 1 violation for direct User entity import
 * // but not for UserId (value object is allowed)
 * console.log(violations.length) // 1
 * ```
 */
export class AggregateBoundaryDetector implements IAggregateBoundaryDetector {
    private readonly folderRegistry: FolderRegistry
    private readonly pathAnalyzer: AggregatePathAnalyzer
    private readonly importValidator: ImportValidator

    constructor() {
        this.folderRegistry = new FolderRegistry()
        this.pathAnalyzer = new AggregatePathAnalyzer(this.folderRegistry)
        this.importValidator = new ImportValidator(this.folderRegistry, this.pathAnalyzer)
    }

    /**
     * Detects aggregate boundary violations in the given code
     *
     * Analyzes import statements to identify direct entity references
     * across aggregate boundaries in the domain layer.
     *
     * @param code - Source code to analyze
     * @param filePath - Path to the file being analyzed
     * @param layer - The architectural layer of the file (should be 'domain')
     * @returns Array of detected aggregate boundary violations
     */
    public detectViolations(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): AggregateBoundaryViolation[] {
        if (layer !== LAYERS.DOMAIN) {
            return []
        }

        const currentAggregate = this.pathAnalyzer.extractAggregateFromPath(filePath)
        if (!currentAggregate) {
            return []
        }

        return this.analyzeImports(code, filePath, currentAggregate)
    }

    /**
     * Checks if a file path belongs to an aggregate
     *
     * Extracts aggregate name from paths like:
     * - domain/aggregates/order/Order.ts → 'order'
     * - domain/order/Order.ts → 'order'
     * - domain/entities/order/Order.ts → 'order'
     *
     * @param filePath - The file path to check
     * @returns The aggregate name if found, undefined otherwise
     */
    public extractAggregateFromPath(filePath: string): string | undefined {
        return this.pathAnalyzer.extractAggregateFromPath(filePath)
    }

    /**
     * Checks if an import path references an entity from another aggregate
     *
     * @param importPath - The import path to analyze
     * @param currentAggregate - The aggregate of the current file
     * @returns True if the import crosses aggregate boundaries inappropriately
     */
    public isAggregateBoundaryViolation(importPath: string, currentAggregate: string): boolean {
        return this.importValidator.isViolation(importPath, currentAggregate)
    }

    /**
     * Analyzes all imports in code and detects violations
     */
    private analyzeImports(
        code: string,
        filePath: string,
        currentAggregate: string,
    ): AggregateBoundaryViolation[] {
        const violations: AggregateBoundaryViolation[] = []
        const lines = code.split("\n")

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lineNumber = i + 1

            const imports = this.importValidator.extractImports(line)
            for (const importPath of imports) {
                const violation = this.checkImport(
                    importPath,
                    currentAggregate,
                    filePath,
                    lineNumber,
                )
                if (violation) {
                    violations.push(violation)
                }
            }
        }

        return violations
    }

    /**
     * Checks a single import for boundary violations
     */
    private checkImport(
        importPath: string,
        currentAggregate: string,
        filePath: string,
        lineNumber: number,
    ): AggregateBoundaryViolation | undefined {
        if (!this.importValidator.isViolation(importPath, currentAggregate)) {
            return undefined
        }

        const targetAggregate = this.pathAnalyzer.extractAggregateFromImport(importPath)
        const entityName = this.pathAnalyzer.extractEntityName(importPath)

        if (targetAggregate && entityName) {
            return AggregateBoundaryViolation.create(
                currentAggregate,
                targetAggregate,
                entityName,
                importPath,
                filePath,
                lineNumber,
            )
        }

        return undefined
    }
}
