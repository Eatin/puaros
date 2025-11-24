import { RepositoryViolation } from "../value-objects/RepositoryViolation"

/**
 * Interface for detecting Repository Pattern violations in the codebase
 *
 * Repository Pattern violations include:
 * - ORM-specific types in repository interfaces (domain layer)
 * - Concrete repository usage in use cases instead of interfaces
 * - Repository instantiation with 'new' in use cases (should use DI)
 * - Non-domain method names in repository interfaces
 *
 * The Repository Pattern ensures that domain logic remains decoupled from
 * infrastructure concerns like databases and ORMs.
 */
export interface IRepositoryPatternDetector {
    /**
     * Detects all Repository Pattern violations in the given code
     *
     * Analyzes code for proper implementation of the Repository Pattern,
     * including interface purity, dependency inversion, and domain language usage.
     *
     * @param code - Source code to analyze
     * @param filePath - Path to the file being analyzed
     * @param layer - The architectural layer of the file (domain, application, infrastructure, shared)
     * @returns Array of detected Repository Pattern violations
     */
    detectViolations(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): RepositoryViolation[]

    /**
     * Checks if a type is an ORM-specific type
     *
     * ORM-specific types include Prisma types, TypeORM decorators, Mongoose schemas, etc.
     * These types should not appear in domain repository interfaces.
     *
     * @param typeName - The type name to check
     * @returns True if the type is ORM-specific
     */
    isOrmType(typeName: string): boolean

    /**
     * Checks if a method name follows domain language conventions
     *
     * Domain repository methods should use business-oriented names like:
     * - findById, findByEmail, findByStatus
     * - save, create, update
     * - delete, remove
     *
     * Avoid technical database terms like:
     * - findOne, findMany, query
     * - insert, select, update (SQL terms)
     *
     * @param methodName - The method name to check
     * @returns True if the method name uses domain language
     */
    isDomainMethodName(methodName: string): boolean

    /**
     * Checks if a file is a repository interface
     *
     * Repository interfaces typically:
     * - Are in the domain layer
     * - Have names matching I*Repository pattern
     * - Contain interface definitions
     *
     * @param filePath - The file path to check
     * @param layer - The architectural layer
     * @returns True if the file is a repository interface
     */
    isRepositoryInterface(filePath: string, layer: string | undefined): boolean

    /**
     * Checks if a file is a use case
     *
     * Use cases typically:
     * - Are in the application layer
     * - Follow verb-noun naming pattern (CreateUser, UpdateProfile)
     * - Contain class definitions for business operations
     *
     * @param filePath - The file path to check
     * @param layer - The architectural layer
     * @returns True if the file is a use case
     */
    isUseCase(filePath: string, layer: string | undefined): boolean
}
