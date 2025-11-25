import { IRepositoryPatternDetector } from "../../domain/services/RepositoryPatternDetectorService"
import { RepositoryViolation } from "../../domain/value-objects/RepositoryViolation"
import { OrmTypeMatcher } from "../strategies/OrmTypeMatcher"
import { MethodNameValidator } from "../strategies/MethodNameValidator"
import { RepositoryFileAnalyzer } from "../strategies/RepositoryFileAnalyzer"
import { RepositoryViolationDetector } from "../strategies/RepositoryViolationDetector"

/**
 * Detects Repository Pattern violations in the codebase
 *
 * This detector identifies violations where the Repository Pattern is not properly implemented:
 * 1. ORM-specific types in repository interfaces (domain should be ORM-agnostic)
 * 2. Concrete repository usage in use cases (violates dependency inversion)
 * 3. Repository instantiation with 'new' in use cases (should use DI)
 * 4. Non-domain method names in repositories (should use ubiquitous language)
 *
 * @example
 * ```typescript
 * const detector = new RepositoryPatternDetector()
 *
 * // Detect violations in a repository interface
 * const code = `
 * interface IUserRepository {
 *     findOne(query: Prisma.UserWhereInput): Promise<User>
 * }
 * `
 * const violations = detector.detectViolations(
 *     code,
 *     'src/domain/repositories/IUserRepository.ts',
 *     'domain'
 * )
 *
 * // violations will contain ORM type violation
 * console.log(violations.length) // 1
 * console.log(violations[0].violationType) // 'orm-type-in-interface'
 * ```
 */
export class RepositoryPatternDetector implements IRepositoryPatternDetector {
    private readonly ormMatcher: OrmTypeMatcher
    private readonly methodValidator: MethodNameValidator
    private readonly fileAnalyzer: RepositoryFileAnalyzer
    private readonly violationDetector: RepositoryViolationDetector

    constructor() {
        this.ormMatcher = new OrmTypeMatcher()
        this.methodValidator = new MethodNameValidator(this.ormMatcher)
        this.fileAnalyzer = new RepositoryFileAnalyzer()
        this.violationDetector = new RepositoryViolationDetector(
            this.ormMatcher,
            this.methodValidator,
        )
    }

    /**
     * Detects all Repository Pattern violations in the given code
     */
    public detectViolations(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): RepositoryViolation[] {
        const violations: RepositoryViolation[] = []

        if (this.fileAnalyzer.isRepositoryInterface(filePath, layer)) {
            violations.push(...this.violationDetector.detectOrmTypes(code, filePath, layer))
            violations.push(...this.violationDetector.detectNonDomainMethods(code, filePath, layer))
        }

        if (this.fileAnalyzer.isUseCase(filePath, layer)) {
            violations.push(
                ...this.violationDetector.detectConcreteRepositoryUsage(code, filePath, layer),
            )
            violations.push(...this.violationDetector.detectNewInstantiation(code, filePath, layer))
        }

        return violations
    }

    /**
     * Checks if a type is an ORM-specific type
     */
    public isOrmType(typeName: string): boolean {
        return this.ormMatcher.isOrmType(typeName)
    }

    /**
     * Checks if a method name follows domain language conventions
     */
    public isDomainMethodName(methodName: string): boolean {
        return this.methodValidator.isDomainMethodName(methodName)
    }

    /**
     * Checks if a file is a repository interface
     */
    public isRepositoryInterface(filePath: string, layer: string | undefined): boolean {
        return this.fileAnalyzer.isRepositoryInterface(filePath, layer)
    }

    /**
     * Checks if a file is a use case
     */
    public isUseCase(filePath: string, layer: string | undefined): boolean {
        return this.fileAnalyzer.isUseCase(filePath, layer)
    }
}
