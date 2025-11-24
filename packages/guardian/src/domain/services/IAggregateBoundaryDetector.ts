import { AggregateBoundaryViolation } from "../value-objects/AggregateBoundaryViolation"

/**
 * Interface for detecting aggregate boundary violations in DDD
 *
 * Aggregate boundary violations occur when an entity from one aggregate
 * directly references an entity from another aggregate. In DDD, aggregates
 * should reference each other only by ID or Value Objects to maintain
 * loose coupling and independence.
 */
export interface IAggregateBoundaryDetector {
    /**
     * Detects aggregate boundary violations in the given code
     *
     * Analyzes import statements to identify direct entity references
     * across aggregate boundaries.
     *
     * @param code - Source code to analyze
     * @param filePath - Path to the file being analyzed
     * @param layer - The architectural layer of the file (should be 'domain')
     * @returns Array of detected aggregate boundary violations
     */
    detectViolations(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): AggregateBoundaryViolation[]

    /**
     * Checks if a file path belongs to an aggregate
     *
     * @param filePath - The file path to check
     * @returns The aggregate name if found, undefined otherwise
     */
    extractAggregateFromPath(filePath: string): string | undefined

    /**
     * Checks if an import path references an entity from another aggregate
     *
     * @param importPath - The import path to analyze
     * @param currentAggregate - The aggregate of the current file
     * @returns True if the import crosses aggregate boundaries inappropriately
     */
    isAggregateBoundaryViolation(importPath: string, currentAggregate: string): boolean
}
