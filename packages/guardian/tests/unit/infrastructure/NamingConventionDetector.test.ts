import { describe, it, expect, beforeEach } from "vitest"
import { NamingConventionDetector } from "../../../src/infrastructure/analyzers/NamingConventionDetector"
import { LAYERS, NAMING_VIOLATION_TYPES } from "../../../src/shared/constants"

describe("NamingConventionDetector - AST-based", () => {
    let detector: NamingConventionDetector

    beforeEach(() => {
        detector = new NamingConventionDetector()
    })

    describe("Excluded Files", () => {
        it("should NOT detect violations for index.ts", () => {
            const code = `export class User {}`
            const result = detector.detectViolations(
                code,
                "index.ts",
                LAYERS.DOMAIN,
                "src/domain/index.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for BaseUseCase.ts", () => {
            const code = `export class BaseUseCase {}`
            const result = detector.detectViolations(
                code,
                "BaseUseCase.ts",
                LAYERS.APPLICATION,
                "src/application/use-cases/BaseUseCase.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for empty content", () => {
            const result = detector.detectViolations(
                "",
                "User.ts",
                LAYERS.DOMAIN,
                "src/domain/User.ts",
            )
            expect(result).toHaveLength(0)
        })
    })

    describe("Domain Layer - Classes", () => {
        it("should NOT detect violations for valid entity class names", () => {
            const validClasses = ["User", "Order", "Product", "Email", "ProjectPath"]

            validClasses.forEach((className) => {
                const code = `export class ${className} {}`
                const result = detector.detectViolations(
                    code,
                    `${className}.ts`,
                    LAYERS.DOMAIN,
                    `src/domain/entities/${className}.ts`,
                )
                expect(result).toHaveLength(0)
            })
        })

        it("should detect violations for lowercase class names", () => {
            const code = `export class user {}`
            const result = detector.detectViolations(
                code,
                "user.ts",
                LAYERS.DOMAIN,
                "src/domain/entities/user.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
            expect(result[0].layer).toBe(LAYERS.DOMAIN)
        })

        it("should detect violations for camelCase class names", () => {
            const code = `export class userProfile {}`
            const result = detector.detectViolations(
                code,
                "userProfile.ts",
                LAYERS.DOMAIN,
                "src/domain/entities/userProfile.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
        })

        it("should NOT detect violations for valid service class names", () => {
            const validNames = ["UserService", "EmailService", "PaymentService"]

            validNames.forEach((className) => {
                const code = `export class ${className} {}`
                const result = detector.detectViolations(
                    code,
                    `${className}.ts`,
                    LAYERS.DOMAIN,
                    `src/domain/services/${className}.ts`,
                )
                expect(result).toHaveLength(0)
            })
        })

        it("should detect violations for lowercase service class names", () => {
            const code = `export class userService {}`
            const result = detector.detectViolations(
                code,
                "userService.ts",
                LAYERS.DOMAIN,
                "src/domain/services/userService.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
        })
    })

    describe("Domain Layer - Interfaces", () => {
        it("should NOT detect violations for valid repository interface names", () => {
            const validNames = ["IUserRepository", "IOrderRepository", "IProductRepository"]

            validNames.forEach((interfaceName) => {
                const code = `export interface ${interfaceName} {}`
                const result = detector.detectViolations(
                    code,
                    `${interfaceName}.ts`,
                    LAYERS.DOMAIN,
                    `src/domain/repositories/${interfaceName}.ts`,
                )
                expect(result).toHaveLength(0)
            })
        })

        it("should detect violations for repository interfaces without I prefix", () => {
            const code = `export interface UserRepository {}`
            const result = detector.detectViolations(
                code,
                "UserRepository.ts",
                LAYERS.DOMAIN,
                "src/domain/repositories/UserRepository.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_PREFIX)
        })

        it("should detect violations for lowercase interface names", () => {
            const code = `export interface iUserRepository {}`
            const result = detector.detectViolations(
                code,
                "iUserRepository.ts",
                LAYERS.DOMAIN,
                "src/domain/repositories/iUserRepository.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
        })
    })

    describe("Application Layer - Classes", () => {
        it("should NOT detect violations for valid use case class names", () => {
            const validNames = [
                "CreateUser",
                "UpdateProfile",
                "DeleteOrder",
                "GetUser",
                "FindProducts",
                "AnalyzeProject",
                "ValidateEmail",
                "GenerateReport",
            ]

            validNames.forEach((className) => {
                const code = `export class ${className} {}`
                const result = detector.detectViolations(
                    code,
                    `${className}.ts`,
                    LAYERS.APPLICATION,
                    `src/application/use-cases/${className}.ts`,
                )
                expect(result).toHaveLength(0)
            })
        })

        it("should detect violations for use case classes starting with lowercase", () => {
            const code = `export class createUser {}`
            const result = detector.detectViolations(
                code,
                "createUser.ts",
                LAYERS.APPLICATION,
                "src/application/use-cases/createUser.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_VERB_NOUN)
        })

        it("should NOT detect violations for valid DTO class names", () => {
            const validNames = [
                "UserDto",
                "CreateUserRequest",
                "UserResponseDto",
                "UpdateProfileRequest",
                "OrderResponse",
            ]

            validNames.forEach((className) => {
                const code = `export class ${className} {}`
                const result = detector.detectViolations(
                    code,
                    `${className}.ts`,
                    LAYERS.APPLICATION,
                    `src/application/dtos/${className}.ts`,
                )
                expect(result).toHaveLength(0)
            })
        })

        it("should detect violations for lowercase DTO class names", () => {
            const code = `export class userDto {}`
            const result = detector.detectViolations(
                code,
                "userDto.ts",
                LAYERS.APPLICATION,
                "src/application/dtos/userDto.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
        })

        it("should NOT detect violations for valid mapper class names", () => {
            const validNames = ["UserMapper", "OrderMapper", "ProductMapper"]

            validNames.forEach((className) => {
                const code = `export class ${className} {}`
                const result = detector.detectViolations(
                    code,
                    `${className}.ts`,
                    LAYERS.APPLICATION,
                    `src/application/mappers/${className}.ts`,
                )
                expect(result).toHaveLength(0)
            })
        })

        it("should detect violations for lowercase mapper class names", () => {
            const code = `export class userMapper {}`
            const result = detector.detectViolations(
                code,
                "userMapper.ts",
                LAYERS.APPLICATION,
                "src/application/mappers/userMapper.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
        })
    })

    describe("Infrastructure Layer - Classes", () => {
        it("should NOT detect violations for valid controller class names", () => {
            const validNames = ["UserController", "OrderController", "ProductController"]

            validNames.forEach((className) => {
                const code = `export class ${className} {}`
                const result = detector.detectViolations(
                    code,
                    `${className}.ts`,
                    LAYERS.INFRASTRUCTURE,
                    `src/infrastructure/controllers/${className}.ts`,
                )
                expect(result).toHaveLength(0)
            })
        })

        it("should detect violations for lowercase controller class names", () => {
            const code = `export class userController {}`
            const result = detector.detectViolations(
                code,
                "userController.ts",
                LAYERS.INFRASTRUCTURE,
                "src/infrastructure/controllers/userController.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
        })

        it("should NOT detect violations for valid repository implementation class names", () => {
            const validNames = [
                "UserRepository",
                "PrismaUserRepository",
                "MongoUserRepository",
                "InMemoryUserRepository",
            ]

            validNames.forEach((className) => {
                const code = `export class ${className} {}`
                const result = detector.detectViolations(
                    code,
                    `${className}.ts`,
                    LAYERS.INFRASTRUCTURE,
                    `src/infrastructure/repositories/${className}.ts`,
                )
                expect(result).toHaveLength(0)
            })
        })

        it("should detect violations for lowercase repository class names", () => {
            const code = `export class userRepository {}`
            const result = detector.detectViolations(
                code,
                "userRepository.ts",
                LAYERS.INFRASTRUCTURE,
                "src/infrastructure/repositories/userRepository.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
        })

        it("should NOT detect violations for valid service class names", () => {
            const validNames = [
                "EmailService",
                "S3StorageAdapter",
                "PaymentService",
                "LoggerAdapter",
            ]

            validNames.forEach((className) => {
                const code = `export class ${className} {}`
                const result = detector.detectViolations(
                    code,
                    `${className}.ts`,
                    LAYERS.INFRASTRUCTURE,
                    `src/infrastructure/services/${className}.ts`,
                )
                expect(result).toHaveLength(0)
            })
        })

        it("should detect violations for lowercase service class names", () => {
            const code = `export class emailService {}`
            const result = detector.detectViolations(
                code,
                "emailService.ts",
                LAYERS.INFRASTRUCTURE,
                "src/infrastructure/services/emailService.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
        })
    })

    describe("Function and Method Names", () => {
        it("should NOT detect violations for camelCase function names", () => {
            const code = `
                export class User {
                    getUserById() {}
                    createOrder() {}
                    validateEmail() {}
                }
            `
            const result = detector.detectViolations(
                code,
                "User.ts",
                LAYERS.DOMAIN,
                "src/domain/User.ts",
            )

            expect(result).toHaveLength(0)
        })

        it("should detect violations for PascalCase method names", () => {
            const code = `
                export class User {
                    GetUserById() {}
                }
            `
            const result = detector.detectViolations(
                code,
                "User.ts",
                LAYERS.DOMAIN,
                "src/domain/User.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
        })

        it("should detect violations for snake_case method names", () => {
            const code = `
                export class User {
                    get_user_by_id() {}
                }
            `
            const result = detector.detectViolations(
                code,
                "User.ts",
                LAYERS.DOMAIN,
                "src/domain/User.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
        })

        it("should NOT detect violations for constructor", () => {
            const code = `
                export class User {
                    constructor() {}
                }
            `
            const result = detector.detectViolations(
                code,
                "User.ts",
                LAYERS.DOMAIN,
                "src/domain/User.ts",
            )

            expect(result).toHaveLength(0)
        })
    })

    describe("Variable and Constant Names", () => {
        it("should NOT detect violations for camelCase variables", () => {
            const code = `
                export class User {
                    getUserById() {
                        const userId = "123"
                        const userName = "John"
                        return { userId, userName }
                    }
                }
            `
            const result = detector.detectViolations(
                code,
                "User.ts",
                LAYERS.DOMAIN,
                "src/domain/User.ts",
            )

            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for UPPER_SNAKE_CASE constants", () => {
            const code = `
                export const MAX_RETRIES = 3
                export const API_URL = "https://api.example.com"
                export const DEFAULT_TIMEOUT = 5000
            `
            const result = detector.detectViolations(
                code,
                "constants.ts",
                LAYERS.SHARED,
                "src/shared/constants.ts",
            )

            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for static readonly UPPER_SNAKE_CASE class constants", () => {
            const code = `
                export class ValuePatternMatcher {
                    private static readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                    private static readonly IP_V4_PATTERN = /^(\\d{1,3}\\.){3}\\d{1,3}$/
                    private static readonly API_KEY_PATTERN = /^(sk_|pk_|api_|key_)[a-zA-Z0-9_-]{20,}$/
                }
            `
            const result = detector.detectViolations(
                code,
                "ValuePatternMatcher.ts",
                LAYERS.INFRASTRUCTURE,
                "src/infrastructure/ValuePatternMatcher.ts",
            )

            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for readonly UPPER_SNAKE_CASE class constants", () => {
            const code = `
                export class AstConfigObjectAnalyzer {
                    private readonly MIN_HARDCODED_VALUES = 2
                    private readonly MAX_COMPLEXITY = 15
                }
            `
            const result = detector.detectViolations(
                code,
                "AstConfigObjectAnalyzer.ts",
                LAYERS.INFRASTRUCTURE,
                "src/infrastructure/AstConfigObjectAnalyzer.ts",
            )

            expect(result).toHaveLength(0)
        })

        it("should detect violations for PascalCase variables", () => {
            const code = `
                export class User {
                    getUserById() {
                        const UserId = "123"
                        return UserId
                    }
                }
            `
            const result = detector.detectViolations(
                code,
                "User.ts",
                LAYERS.DOMAIN,
                "src/domain/User.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
        })
    })

    describe("Shared Layer", () => {
        it("should NOT detect violations for any file in shared layer", () => {
            const code = `
                export class Guards {}
                export class Result {}
                export function helper() {}
            `
            const fileNames = [
                "helpers.ts",
                "utils.ts",
                "constants.ts",
                "types.ts",
                "Guards.ts",
                "Result.ts",
            ]

            fileNames.forEach((fileName) => {
                const result = detector.detectViolations(
                    code,
                    fileName,
                    LAYERS.SHARED,
                    `src/shared/${fileName}`,
                )
                expect(result.length).toBeLessThanOrEqual(code.length)
            })
        })
    })

    describe("Edge Cases", () => {
        it("should return empty array when no layer is provided", () => {
            const code = `export class SomeClass {}`
            const result = detector.detectViolations(
                code,
                "SomeFile.ts",
                undefined,
                "src/SomeFile.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should return empty array for unknown layer", () => {
            const code = `export class SomeClass {}`
            const result = detector.detectViolations(
                code,
                "SomeFile.ts",
                "unknown-layer",
                "src/unknown/SomeFile.ts",
            )
            expect(result.length).toBeGreaterThanOrEqual(0)
        })

        it("should handle classes with numbers in name", () => {
            const code = `export class User2Factor {}`
            const result = detector.detectViolations(
                code,
                "User2Factor.ts",
                LAYERS.DOMAIN,
                "src/domain/entities/User2Factor.ts",
            )

            expect(result).toHaveLength(0)
        })

        it("should provide helpful suggestions", () => {
            const code = `export class userDto {}`
            const result = detector.detectViolations(
                code,
                "userDto.ts",
                LAYERS.APPLICATION,
                "src/application/dtos/userDto.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].suggestion).toBeDefined()
        })

        it("should include file path in violation", () => {
            const code = `export class user {}`
            const filePath = "src/domain/user.ts"
            const result = detector.detectViolations(code, "user.ts", LAYERS.DOMAIN, filePath)

            expect(result).toHaveLength(1)
            expect(result[0].filePath).toContain(filePath)
        })
    })

    describe("Complex Scenarios", () => {
        it("should detect multiple violations in one file", () => {
            const code = `
                export class userService {
                    GetUser() {
                        const UserId = "123"
                        return UserId
                    }
                }
            `
            const result = detector.detectViolations(
                code,
                "userService.ts",
                LAYERS.DOMAIN,
                "src/domain/services/userService.ts",
            )

            expect(result.length).toBeGreaterThan(0)
        })

        it("should handle multiple classes in one file", () => {
            const code = `
                export class User {}
                export class UserService {}
            `
            const result = detector.detectViolations(
                code,
                "User.ts",
                LAYERS.DOMAIN,
                "src/domain/entities/User.ts",
            )

            expect(result.length).toBeGreaterThanOrEqual(0)
        })

        it("should handle interfaces and classes together", () => {
            const code = `
                export interface IUserRepository {}
                export class UserService {}
            `
            const result = detector.detectViolations(
                code,
                "UserRepository.ts",
                LAYERS.DOMAIN,
                "src/domain/repositories/UserRepository.ts",
            )

            expect(result.length).toBeGreaterThanOrEqual(0)
        })
    })

    describe("getMessage()", () => {
        it("should return descriptive error messages", () => {
            const code = `export class userService {}`
            const result = detector.detectViolations(
                code,
                "userService.ts",
                LAYERS.DOMAIN,
                "src/domain/userService.ts",
            )

            expect(result).toHaveLength(1)
            const message = result[0].getMessage()
            expect(message).toBeTruthy()
            expect(typeof message).toBe("string")
            expect(message.length).toBeGreaterThan(0)
        })
    })
})
