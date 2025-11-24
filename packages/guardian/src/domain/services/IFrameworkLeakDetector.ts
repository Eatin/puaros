import { FrameworkLeak } from "../value-objects/FrameworkLeak"

/**
 * Interface for detecting framework-specific imports in domain layer
 *
 * Framework leaks occur when domain layer imports framework-specific packages,
 * violating Clean Architecture principles by creating tight coupling to external frameworks.
 */
export interface IFrameworkLeakDetector {
    /**
     * Detects framework leaks in the given file
     *
     * @param imports - Array of import paths from the file
     * @param filePath - Path to the file being analyzed
     * @param layer - The architectural layer of the file (domain, application, infrastructure, shared)
     * @returns Array of detected framework leaks
     */
    detectLeaks(imports: string[], filePath: string, layer: string | undefined): FrameworkLeak[]

    /**
     * Checks if a specific import is a framework package
     *
     * @param importPath - The import path to check
     * @returns True if the import is a framework package
     */
    isFrameworkPackage(importPath: string): boolean
}
