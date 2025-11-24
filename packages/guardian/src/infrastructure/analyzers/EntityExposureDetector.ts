import { IEntityExposureDetector } from "../../domain/services/IEntityExposureDetector"
import { EntityExposure } from "../../domain/value-objects/EntityExposure"
import { LAYERS } from "../../shared/constants/rules"

/**
 * Detects domain entity exposure in controller/route return types
 *
 * This detector identifies violations where controllers or route handlers
 * directly return domain entities instead of using DTOs (Data Transfer Objects).
 * This violates separation of concerns and can expose internal domain logic.
 *
 * @example
 * ```typescript
 * const detector = new EntityExposureDetector()
 *
 * // Detect exposures in a controller file
 * const code = `
 * class UserController {
 *     async getUser(id: string): Promise<User> {
 *         return this.userService.findById(id)
 *     }
 * }
 * `
 * const exposures = detector.detectExposures(code, 'src/infrastructure/controllers/UserController.ts', 'infrastructure')
 *
 * // exposures will contain violation for returning User entity
 * console.log(exposures.length) // 1
 * console.log(exposures[0].entityName) // 'User'
 * ```
 */
export class EntityExposureDetector implements IEntityExposureDetector {
    private readonly dtoSuffixes = [
        "Dto",
        "DTO",
        "Request",
        "Response",
        "Command",
        "Query",
        "Result",
    ]
    private readonly controllerPatterns = [
        /Controller/i,
        /Route/i,
        /Handler/i,
        /Resolver/i,
        /Gateway/i,
    ]

    /**
     * Detects entity exposure violations in the given code
     *
     * Analyzes method return types in controllers/routes to identify
     * domain entities being directly exposed to external clients.
     *
     * @param code - Source code to analyze
     * @param filePath - Path to the file being analyzed
     * @param layer - The architectural layer of the file (domain, application, infrastructure, shared)
     * @returns Array of detected entity exposure violations
     */
    public detectExposures(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): EntityExposure[] {
        if (layer !== LAYERS.INFRASTRUCTURE || !this.isControllerFile(filePath)) {
            return []
        }

        const exposures: EntityExposure[] = []
        const lines = code.split("\n")

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lineNumber = i + 1

            const methodMatches = this.findMethodReturnTypes(line)
            for (const match of methodMatches) {
                const { methodName, returnType } = match

                if (this.isDomainEntity(returnType)) {
                    exposures.push(
                        EntityExposure.create(
                            returnType,
                            returnType,
                            filePath,
                            layer,
                            lineNumber,
                            methodName,
                        ),
                    )
                }
            }
        }

        return exposures
    }

    /**
     * Checks if a return type is a domain entity
     *
     * Domain entities are typically PascalCase nouns without Dto/Request/Response suffixes
     * and are defined in the domain layer.
     *
     * @param returnType - The return type to check
     * @returns True if the return type appears to be a domain entity
     */
    public isDomainEntity(returnType: string): boolean {
        if (!returnType || returnType.trim() === "") {
            return false
        }

        const cleanType = this.extractCoreType(returnType)

        if (this.isPrimitiveType(cleanType)) {
            return false
        }

        if (this.hasAllowedSuffix(cleanType)) {
            return false
        }

        return this.isPascalCase(cleanType)
    }

    /**
     * Checks if the file is a controller/route file
     */
    private isControllerFile(filePath: string): boolean {
        return this.controllerPatterns.some((pattern) => pattern.test(filePath))
    }

    /**
     * Finds method return types in a line of code
     */
    private findMethodReturnTypes(line: string): { methodName: string; returnType: string }[] {
        const matches: { methodName: string; returnType: string }[] = []

        const methodRegex =
            /(?:async\s+)?(\w+)\s*\([^)]*\)\s*:\s*Promise<([^>]+)>|(?:async\s+)?(\w+)\s*\([^)]*\)\s*:\s*([A-Z]\w+)/g

        let match
        while ((match = methodRegex.exec(line)) !== null) {
            const methodName = match[1] || match[3]
            const returnType = match[2] || match[4]

            if (methodName && returnType) {
                matches.push({ methodName, returnType })
            }
        }

        return matches
    }

    /**
     * Extracts core type from complex type annotations
     * Examples:
     * - "Promise<User>" -> "User"
     * - "User[]" -> "User"
     * - "User | null" -> "User"
     */
    private extractCoreType(returnType: string): string {
        let cleanType = returnType.trim()

        cleanType = cleanType.replace(/Promise<([^>]+)>/, "$1")

        cleanType = cleanType.replace(/\[\]$/, "")

        if (cleanType.includes("|")) {
            const types = cleanType.split("|").map((t) => t.trim())
            const nonNullTypes = types.filter((t) => t !== "null" && t !== "undefined")
            if (nonNullTypes.length > 0) {
                cleanType = nonNullTypes[0]
            }
        }

        return cleanType.trim()
    }

    /**
     * Checks if a type is a primitive type
     */
    private isPrimitiveType(type: string): boolean {
        const primitives = [
            "string",
            "number",
            "boolean",
            "void",
            "any",
            "unknown",
            "null",
            "undefined",
            "object",
            "never",
        ]
        return primitives.includes(type.toLowerCase())
    }

    /**
     * Checks if a type has an allowed DTO/Response suffix
     */
    private hasAllowedSuffix(type: string): boolean {
        return this.dtoSuffixes.some((suffix) => type.endsWith(suffix))
    }

    /**
     * Checks if a string is in PascalCase
     */
    private isPascalCase(str: string): boolean {
        if (!str || str.length === 0) {
            return false
        }
        return /^[A-Z]([a-z0-9]+[A-Z]?)*[a-z0-9]*$/.test(str) && /[a-z]/.test(str)
    }
}
