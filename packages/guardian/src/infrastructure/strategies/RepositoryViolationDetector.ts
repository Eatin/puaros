import { RepositoryViolation } from "../../domain/value-objects/RepositoryViolation"
import { LAYERS, REPOSITORY_VIOLATION_TYPES } from "../../shared/constants/rules"
import { REPOSITORY_PATTERN_MESSAGES } from "../../domain/constants/Messages"
import { OrmTypeMatcher } from "./OrmTypeMatcher"
import { MethodNameValidator } from "./MethodNameValidator"

/**
 * Detects specific repository pattern violations
 *
 * Handles detection of ORM types, non-domain methods, concrete repositories,
 * and repository instantiation violations.
 */
export class RepositoryViolationDetector {
    constructor(
        private readonly ormMatcher: OrmTypeMatcher,
        private readonly methodValidator: MethodNameValidator,
    ) {}

    /**
     * Detects ORM types in repository interface
     */
    public detectOrmTypes(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): RepositoryViolation[] {
        const violations: RepositoryViolation[] = []
        const lines = code.split("\n")

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lineNumber = i + 1

            this.detectOrmInMethod(line, lineNumber, filePath, layer, violations)
            this.detectOrmInLine(line, lineNumber, filePath, layer, violations)
        }

        return violations
    }

    /**
     * Detects non-domain method names
     */
    public detectNonDomainMethods(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): RepositoryViolation[] {
        const violations: RepositoryViolation[] = []
        const lines = code.split("\n")

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lineNumber = i + 1

            const methodMatch = /^\s*(\w+)\s*\(/.exec(line)

            if (methodMatch) {
                const methodName = methodMatch[1]

                if (
                    !this.methodValidator.isDomainMethodName(methodName) &&
                    !line.trim().startsWith("//")
                ) {
                    const suggestion = this.methodValidator.suggestDomainMethodName(methodName)
                    violations.push(
                        RepositoryViolation.create(
                            REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
                            filePath,
                            layer || LAYERS.DOMAIN,
                            lineNumber,
                            `Method '${methodName}' uses technical name instead of domain language. ${suggestion}`,
                            undefined,
                            undefined,
                            methodName,
                        ),
                    )
                }
            }
        }

        return violations
    }

    /**
     * Detects concrete repository usage
     */
    public detectConcreteRepositoryUsage(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): RepositoryViolation[] {
        const violations: RepositoryViolation[] = []
        const lines = code.split("\n")

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lineNumber = i + 1

            this.detectConcreteInConstructor(line, lineNumber, filePath, layer, violations)
            this.detectConcreteInField(line, lineNumber, filePath, layer, violations)
        }

        return violations
    }

    /**
     * Detects new Repository() instantiation
     */
    public detectNewInstantiation(
        code: string,
        filePath: string,
        layer: string | undefined,
    ): RepositoryViolation[] {
        const violations: RepositoryViolation[] = []
        const lines = code.split("\n")

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lineNumber = i + 1

            const newRepositoryMatch = /new\s+([A-Z]\w*Repository)\s*\(/.exec(line)

            if (newRepositoryMatch && !line.trim().startsWith("//")) {
                const repositoryName = newRepositoryMatch[1]
                violations.push(
                    RepositoryViolation.create(
                        REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
                        filePath,
                        layer || LAYERS.APPLICATION,
                        lineNumber,
                        `Use case creates repository with 'new ${repositoryName}()'`,
                        undefined,
                        repositoryName,
                    ),
                )
            }
        }

        return violations
    }

    /**
     * Detects ORM types in method signatures
     */
    private detectOrmInMethod(
        line: string,
        lineNumber: number,
        filePath: string,
        layer: string | undefined,
        violations: RepositoryViolation[],
    ): void {
        const methodMatch =
            /(\w+)\s*\([^)]*:\s*([^)]+)\)\s*:\s*.*?(?:Promise<([^>]+)>|([A-Z]\w+))/.exec(line)

        if (methodMatch) {
            const params = methodMatch[2]
            const returnType = methodMatch[3] || methodMatch[4]

            if (this.ormMatcher.isOrmType(params)) {
                const ormType = this.ormMatcher.extractOrmType(params)
                violations.push(
                    RepositoryViolation.create(
                        REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                        filePath,
                        layer || LAYERS.DOMAIN,
                        lineNumber,
                        `Method parameter uses ORM type: ${ormType}`,
                        ormType,
                    ),
                )
            }

            if (returnType && this.ormMatcher.isOrmType(returnType)) {
                const ormType = this.ormMatcher.extractOrmType(returnType)
                violations.push(
                    RepositoryViolation.create(
                        REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                        filePath,
                        layer || LAYERS.DOMAIN,
                        lineNumber,
                        `Method return type uses ORM type: ${ormType}`,
                        ormType,
                    ),
                )
            }
        }
    }

    /**
     * Detects ORM types in general code line
     */
    private detectOrmInLine(
        line: string,
        lineNumber: number,
        filePath: string,
        layer: string | undefined,
        violations: RepositoryViolation[],
    ): void {
        if (this.ormMatcher.isOrmType(line) && !line.trim().startsWith("//")) {
            const ormType = this.ormMatcher.extractOrmType(line)
            violations.push(
                RepositoryViolation.create(
                    REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                    filePath,
                    layer || LAYERS.DOMAIN,
                    lineNumber,
                    `Repository interface contains ORM-specific type: ${ormType}`,
                    ormType,
                ),
            )
        }
    }

    /**
     * Detects concrete repository in constructor
     */
    private detectConcreteInConstructor(
        line: string,
        lineNumber: number,
        filePath: string,
        layer: string | undefined,
        violations: RepositoryViolation[],
    ): void {
        const constructorParamMatch =
            /constructor\s*\([^)]*(?:private|public|protected)\s+(?:readonly\s+)?(\w+)\s*:\s*([A-Z]\w*Repository)/.exec(
                line,
            )

        if (constructorParamMatch) {
            const repositoryType = constructorParamMatch[2]

            if (!repositoryType.startsWith("I")) {
                violations.push(
                    RepositoryViolation.create(
                        REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
                        filePath,
                        layer || LAYERS.APPLICATION,
                        lineNumber,
                        `Use case depends on concrete repository '${repositoryType}'`,
                        undefined,
                        repositoryType,
                    ),
                )
            }
        }
    }

    /**
     * Detects concrete repository in field
     */
    private detectConcreteInField(
        line: string,
        lineNumber: number,
        filePath: string,
        layer: string | undefined,
        violations: RepositoryViolation[],
    ): void {
        const fieldMatch =
            /(?:private|public|protected)\s+(?:readonly\s+)?(\w+)\s*:\s*([A-Z]\w*Repository)/.exec(
                line,
            )

        if (fieldMatch) {
            const repositoryType = fieldMatch[2]

            if (
                !repositoryType.startsWith("I") &&
                !line.includes(REPOSITORY_PATTERN_MESSAGES.CONSTRUCTOR)
            ) {
                violations.push(
                    RepositoryViolation.create(
                        REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
                        filePath,
                        layer || LAYERS.APPLICATION,
                        lineNumber,
                        `Use case field uses concrete repository '${repositoryType}'`,
                        undefined,
                        repositoryType,
                    ),
                )
            }
        }
    }
}
