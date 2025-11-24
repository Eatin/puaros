import { DependencyViolation } from "../value-objects/DependencyViolation"

/**
 * Interface for detecting dependency direction violations in the codebase
 *
 * Dependency direction violations occur when a layer imports from a layer
 * that it should not depend on according to Clean Architecture principles:
 * - Domain should not import from Application or Infrastructure
 * - Application should not import from Infrastructure
 * - Infrastructure can import from Application and Domain
 * - Shared can be imported by all layers
 */
export interface IDependencyDirectionDetector {
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
    detectViolations(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): DependencyViolation[]

    /**
     * Checks if an import violates dependency direction rules
     *
     * @param fromLayer - The layer that is importing
     * @param toLayer - The layer being imported
     * @returns True if the import violates dependency rules
     */
    isViolation(fromLayer: string, toLayer: string): boolean

    /**
     * Extracts the layer from an import path
     *
     * @param importPath - The import path to analyze
     * @returns The layer name if detected, undefined otherwise
     */
    extractLayerFromImport(importPath: string): string | undefined
}
