import { IFrameworkLeakDetector } from "../../domain/services/IFrameworkLeakDetector"
import { FrameworkLeak } from "../../domain/value-objects/FrameworkLeak"
import { FRAMEWORK_PACKAGES, LAYERS } from "../../shared/constants/rules"

/**
 * Detects framework-specific imports in domain layer
 *
 * This detector identifies violations where domain layer files import framework-specific packages,
 * which creates tight coupling and violates Clean Architecture principles.
 *
 * The domain layer should only contain business logic and domain interfaces.
 * Framework implementations should be in the infrastructure layer.
 *
 * @example
 * ```typescript
 * const detector = new FrameworkLeakDetector()
 *
 * // Detect leaks in a domain file
 * const imports = ['@prisma/client', 'express', '../entities/User']
 * const leaks = detector.detectLeaks(imports, 'src/domain/User.ts', 'domain')
 *
 * // leaks will contain violations for '@prisma/client' and 'express'
 * console.log(leaks.length) // 2
 * console.log(leaks[0].packageName) // '@prisma/client'
 * console.log(leaks[0].category) // 'ORM'
 * ```
 */
export class FrameworkLeakDetector implements IFrameworkLeakDetector {
    private readonly frameworkPackages: Map<string, string>

    constructor() {
        this.frameworkPackages = this.buildFrameworkPackageMap()
    }

    /**
     * Detects framework leaks in the given file
     *
     * @param imports - Array of import paths from the file
     * @param filePath - Path to the file being analyzed
     * @param layer - The architectural layer of the file (domain, application, infrastructure, shared)
     * @returns Array of detected framework leaks
     */
    public detectLeaks(
        imports: string[],
        filePath: string,
        layer: string | undefined,
    ): FrameworkLeak[] {
        if (layer !== LAYERS.DOMAIN) {
            return []
        }

        const leaks: FrameworkLeak[] = []

        for (const importPath of imports) {
            const category = this.getFrameworkCategory(importPath)
            if (category) {
                leaks.push(FrameworkLeak.create(importPath, filePath, layer, category))
            }
        }

        return leaks
    }

    /**
     * Checks if a specific import is a framework package
     *
     * @param importPath - The import path to check
     * @returns True if the import is a framework package
     */
    public isFrameworkPackage(importPath: string): boolean {
        return this.frameworkPackages.has(importPath)
    }

    /**
     * Gets the category of a framework package
     *
     * @param importPath - The import path to check
     * @returns The category name if it's a framework package, undefined otherwise
     */
    private getFrameworkCategory(importPath: string): string | undefined {
        if (importPath.startsWith(".") || importPath.startsWith("/")) {
            return undefined
        }

        return this.frameworkPackages.get(importPath)
    }

    /**
     * Builds a map of framework packages to their categories
     *
     * @returns Map of package names to category names
     */
    private buildFrameworkPackageMap(): Map<string, string> {
        const map = new Map<string, string>()

        for (const [category, packages] of Object.entries(FRAMEWORK_PACKAGES)) {
            for (const pkg of packages) {
                map.set(pkg, category)
            }
        }

        return map
    }
}
