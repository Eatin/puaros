import { EntityExposure } from "../value-objects/EntityExposure"

/**
 * Interface for detecting entity exposure violations in the codebase
 *
 * Entity exposure occurs when domain entities are directly returned from
 * controllers/routes instead of using DTOs (Data Transfer Objects).
 * This violates separation of concerns and can expose internal domain logic.
 */
export interface IEntityExposureDetector {
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
    detectExposures(code: string, filePath: string, layer: string | undefined): EntityExposure[]

    /**
     * Checks if a return type is a domain entity
     *
     * Domain entities are typically PascalCase nouns without Dto/Request/Response suffixes
     * and are defined in the domain layer.
     *
     * @param returnType - The return type to check
     * @returns True if the return type appears to be a domain entity
     */
    isDomainEntity(returnType: string): boolean
}
