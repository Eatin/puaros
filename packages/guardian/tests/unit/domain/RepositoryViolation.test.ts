import { describe, it, expect } from "vitest"
import { RepositoryViolation } from "../../../src/domain/value-objects/RepositoryViolation"
import { REPOSITORY_VIOLATION_TYPES } from "../../../src/shared/constants/rules"

describe("RepositoryViolation", () => {
    describe("create", () => {
        it("should create a repository violation for ORM type in interface", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Repository uses Prisma type",
                "Prisma.UserWhereInput",
            )

            expect(violation.violationType).toBe(REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE)
            expect(violation.filePath).toBe("src/domain/repositories/IUserRepository.ts")
            expect(violation.layer).toBe("domain")
            expect(violation.line).toBe(15)
            expect(violation.details).toBe("Repository uses Prisma type")
            expect(violation.ormType).toBe("Prisma.UserWhereInput")
        })

        it("should create a repository violation for concrete repository in use case", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
                "src/application/use-cases/CreateUser.ts",
                "application",
                10,
                "Use case depends on concrete repository",
                undefined,
                "UserRepository",
            )

            expect(violation.violationType).toBe(
                REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
            )
            expect(violation.repositoryName).toBe("UserRepository")
        })

        it("should create a repository violation for new repository in use case", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
                "src/application/use-cases/CreateUser.ts",
                "application",
                12,
                "Use case creates repository with new",
                undefined,
                "UserRepository",
            )

            expect(violation.violationType).toBe(
                REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
            )
            expect(violation.repositoryName).toBe("UserRepository")
        })

        it("should create a repository violation for non-domain method name", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                8,
                "Method uses technical name. Consider: findById()",
                undefined,
                undefined,
                "findOne",
            )

            expect(violation.violationType).toBe(REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME)
            expect(violation.methodName).toBe("findOne")
        })

        it("should handle optional line parameter", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                undefined,
                "Repository uses Prisma type",
            )

            expect(violation.line).toBeUndefined()
        })
    })

    describe("getters", () => {
        it("should return violation type", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            expect(violation.violationType).toBe(REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE)
        })

        it("should return file path", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            expect(violation.filePath).toBe("src/domain/repositories/IUserRepository.ts")
        })

        it("should return layer", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            expect(violation.layer).toBe("domain")
        })

        it("should return line number", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            expect(violation.line).toBe(15)
        })

        it("should return details", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Repository uses Prisma type",
            )

            expect(violation.details).toBe("Repository uses Prisma type")
        })

        it("should return ORM type", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
                "Prisma.UserWhereInput",
            )

            expect(violation.ormType).toBe("Prisma.UserWhereInput")
        })

        it("should return repository name", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
                "src/application/use-cases/CreateUser.ts",
                "application",
                10,
                "Test",
                undefined,
                "UserRepository",
            )

            expect(violation.repositoryName).toBe("UserRepository")
        })

        it("should return method name", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                8,
                "Test",
                undefined,
                undefined,
                "findOne",
            )

            expect(violation.methodName).toBe("findOne")
        })
    })

    describe("getMessage", () => {
        it("should return message for ORM type in interface", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
                "Prisma.UserWhereInput",
            )

            const message = violation.getMessage()

            expect(message).toContain("ORM-specific type")
            expect(message).toContain("Prisma.UserWhereInput")
        })

        it("should return message for concrete repository in use case", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
                "src/application/use-cases/CreateUser.ts",
                "application",
                10,
                "Test",
                undefined,
                "UserRepository",
            )

            const message = violation.getMessage()

            expect(message).toContain("depends on concrete repository")
            expect(message).toContain("UserRepository")
        })

        it("should return message for new repository in use case", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
                "src/application/use-cases/CreateUser.ts",
                "application",
                12,
                "Test",
                undefined,
                "UserRepository",
            )

            const message = violation.getMessage()

            expect(message).toContain("creates repository with 'new")
            expect(message).toContain("UserRepository")
        })

        it("should return message for non-domain method name", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                8,
                "Test",
                undefined,
                undefined,
                "findOne",
            )

            const message = violation.getMessage()

            expect(message).toContain("uses technical name")
            expect(message).toContain("findOne")
        })

        it("should handle unknown ORM type gracefully", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            const message = violation.getMessage()

            expect(message).toContain("unknown")
        })
    })

    describe("getSuggestion", () => {
        it("should return suggestion for ORM type in interface", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
                "Prisma.UserWhereInput",
            )

            const suggestion = violation.getSuggestion()

            expect(suggestion).toContain("Remove ORM-specific types")
            expect(suggestion).toContain("Use domain types")
        })

        it("should return suggestion for concrete repository in use case", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
                "src/application/use-cases/CreateUser.ts",
                "application",
                10,
                "Test",
                undefined,
                "UserRepository",
            )

            const suggestion = violation.getSuggestion()

            expect(suggestion).toContain("Depend on repository interface")
            expect(suggestion).toContain("IUserRepository")
        })

        it("should return suggestion for new repository in use case", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
                "src/application/use-cases/CreateUser.ts",
                "application",
                12,
                "Test",
                undefined,
                "UserRepository",
            )

            const suggestion = violation.getSuggestion()

            expect(suggestion).toContain("Remove 'new Repository()'")
            expect(suggestion).toContain("dependency injection")
        })

        it("should return suggestion for non-domain method name with smart suggestion", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                8,
                "Method uses technical name. Consider: findById()",
                undefined,
                undefined,
                "findOne",
            )

            const suggestion = violation.getSuggestion()

            expect(suggestion).toContain("findById()")
        })

        it("should return fallback suggestion for known technical method", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                8,
                "Method uses technical name",
                undefined,
                undefined,
                "insert",
            )

            const suggestion = violation.getSuggestion()

            expect(suggestion).toContain("save or create")
        })

        it("should return default suggestion for unknown method", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                8,
                "Method uses technical name",
                undefined,
                undefined,
                "unknownMethod",
            )

            const suggestion = violation.getSuggestion()

            expect(suggestion).toBeDefined()
            expect(suggestion.length).toBeGreaterThan(0)
        })
    })

    describe("getExampleFix", () => {
        it("should return example fix for ORM type in interface", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            const example = violation.getExampleFix()

            expect(example).toContain("BAD")
            expect(example).toContain("GOOD")
            expect(example).toContain("IUserRepository")
        })

        it("should return example fix for concrete repository in use case", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
                "src/application/use-cases/CreateUser.ts",
                "application",
                10,
                "Test",
            )

            const example = violation.getExampleFix()

            expect(example).toContain("BAD")
            expect(example).toContain("GOOD")
            expect(example).toContain("CreateUser")
        })

        it("should return example fix for new repository in use case", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
                "src/application/use-cases/CreateUser.ts",
                "application",
                12,
                "Test",
            )

            const example = violation.getExampleFix()

            expect(example).toContain("BAD")
            expect(example).toContain("GOOD")
            expect(example).toContain("new UserRepository")
        })

        it("should return example fix for non-domain method name", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                8,
                "Test",
            )

            const example = violation.getExampleFix()

            expect(example).toContain("BAD")
            expect(example).toContain("GOOD")
            expect(example).toContain("findOne")
        })
    })

    describe("equals", () => {
        it("should return true for violations with identical properties", () => {
            const violation1 = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
                "Prisma.UserWhereInput",
            )

            const violation2 = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
                "Prisma.UserWhereInput",
            )

            expect(violation1.equals(violation2)).toBe(true)
        })

        it("should return false for violations with different types", () => {
            const violation1 = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            const violation2 = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            expect(violation1.equals(violation2)).toBe(false)
        })

        it("should return false for violations with different file paths", () => {
            const violation1 = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            const violation2 = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IOrderRepository.ts",
                "domain",
                15,
                "Test",
            )

            expect(violation1.equals(violation2)).toBe(false)
        })

        it("should return false when comparing with undefined", () => {
            const violation = RepositoryViolation.create(
                REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
                15,
                "Test",
            )

            expect(violation.equals(undefined)).toBe(false)
        })
    })
})
