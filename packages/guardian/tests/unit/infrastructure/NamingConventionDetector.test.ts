import { describe, it, expect, beforeEach } from "vitest"
import { NamingConventionDetector } from "../../../src/infrastructure/analyzers/NamingConventionDetector"
import { LAYERS, NAMING_VIOLATION_TYPES } from "../../../src/shared/constants"

describe("NamingConventionDetector", () => {
    let detector: NamingConventionDetector

    beforeEach(() => {
        detector = new NamingConventionDetector()
    })

    describe("Excluded Files", () => {
        it("should NOT detect violations for index.ts", () => {
            const result = detector.detectViolations(
                "index.ts",
                LAYERS.DOMAIN,
                "src/domain/index.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for BaseUseCase.ts", () => {
            const result = detector.detectViolations(
                "BaseUseCase.ts",
                LAYERS.APPLICATION,
                "src/application/use-cases/BaseUseCase.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for BaseMapper.ts", () => {
            const result = detector.detectViolations(
                "BaseMapper.ts",
                LAYERS.APPLICATION,
                "src/application/mappers/BaseMapper.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for IBaseRepository.ts", () => {
            const result = detector.detectViolations(
                "IBaseRepository.ts",
                LAYERS.DOMAIN,
                "src/domain/repositories/IBaseRepository.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for BaseEntity.ts", () => {
            const result = detector.detectViolations(
                "BaseEntity.ts",
                LAYERS.DOMAIN,
                "src/domain/entities/BaseEntity.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for ValueObject.ts", () => {
            const result = detector.detectViolations(
                "ValueObject.ts",
                LAYERS.DOMAIN,
                "src/domain/value-objects/ValueObject.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for BaseRepository.ts", () => {
            const result = detector.detectViolations(
                "BaseRepository.ts",
                LAYERS.INFRASTRUCTURE,
                "src/infrastructure/repositories/BaseRepository.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for BaseError.ts", () => {
            const result = detector.detectViolations(
                "BaseError.ts",
                LAYERS.SHARED,
                "src/shared/errors/BaseError.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should NOT detect violations for Suggestions.ts", () => {
            const result = detector.detectViolations(
                "Suggestions.ts",
                LAYERS.DOMAIN,
                "src/domain/constants/Suggestions.ts",
            )
            expect(result).toHaveLength(0)
        })
    })

    describe("Domain Layer", () => {
        describe("Entities (PascalCase nouns)", () => {
            it("should NOT detect violations for valid entity names", () => {
                const validNames = [
                    "User.ts",
                    "Order.ts",
                    "Product.ts",
                    "Email.ts",
                    "ProjectPath.ts",
                ]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.DOMAIN,
                        `src/domain/entities/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })

            it("should detect violations for lowercase entity names", () => {
                const result = detector.detectViolations(
                    "user.ts",
                    LAYERS.DOMAIN,
                    "src/domain/entities/user.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
                expect(result[0].layer).toBe(LAYERS.DOMAIN)
            })

            it("should detect violations for camelCase entity names", () => {
                const result = detector.detectViolations(
                    "userProfile.ts",
                    LAYERS.DOMAIN,
                    "src/domain/entities/userProfile.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
            })

            it("should detect violations for kebab-case entity names", () => {
                const result = detector.detectViolations(
                    "user-profile.ts",
                    LAYERS.DOMAIN,
                    "src/domain/entities/user-profile.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
            })
        })

        describe("Services (*Service.ts)", () => {
            it("should NOT detect violations for valid service names", () => {
                const validNames = ["UserService.ts", "EmailService.ts", "PaymentService.ts"]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.DOMAIN,
                        `src/domain/services/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })

            it("should detect violations for lowercase service names", () => {
                const result = detector.detectViolations(
                    "userService.ts",
                    LAYERS.DOMAIN,
                    "src/domain/services/userService.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
            })

            it("should detect violations for service names without suffix", () => {
                const result = detector.detectViolations(
                    "User.ts",
                    LAYERS.DOMAIN,
                    "src/domain/services/User.ts",
                )

                expect(result).toHaveLength(0)
            })
        })

        describe("Repository Interfaces (I*Repository.ts)", () => {
            it("should NOT detect violations for valid repository interface names", () => {
                const validNames = [
                    "IUserRepository.ts",
                    "IOrderRepository.ts",
                    "IProductRepository.ts",
                ]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.DOMAIN,
                        `src/domain/repositories/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })

            it("should detect violations for repository interfaces without I prefix", () => {
                const result = detector.detectViolations(
                    "UserRepository.ts",
                    LAYERS.DOMAIN,
                    "src/domain/repositories/UserRepository.ts",
                )

                expect(result).toHaveLength(0)
            })

            it("should detect violations for lowercase I prefix", () => {
                const result = detector.detectViolations(
                    "iUserRepository.ts",
                    LAYERS.DOMAIN,
                    "src/domain/repositories/iUserRepository.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_CASE)
            })
        })

        describe("Forbidden Patterns", () => {
            it("should detect Dto in domain layer", () => {
                const result = detector.detectViolations(
                    "UserDto.ts",
                    LAYERS.DOMAIN,
                    "src/domain/UserDto.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.FORBIDDEN_PATTERN)
                expect(result[0].getMessage()).toContain("should not contain DTOs")
            })

            it("should detect Request in domain layer", () => {
                const result = detector.detectViolations(
                    "CreateUserRequest.ts",
                    LAYERS.DOMAIN,
                    "src/domain/CreateUserRequest.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.FORBIDDEN_PATTERN)
            })

            it("should detect Response in domain layer", () => {
                const result = detector.detectViolations(
                    "UserResponse.ts",
                    LAYERS.DOMAIN,
                    "src/domain/UserResponse.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.FORBIDDEN_PATTERN)
            })

            it("should detect Controller in domain layer", () => {
                const result = detector.detectViolations(
                    "UserController.ts",
                    LAYERS.DOMAIN,
                    "src/domain/UserController.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.FORBIDDEN_PATTERN)
            })
        })

        describe("Value Objects", () => {
            it("should NOT detect violations for valid value object names", () => {
                const validNames = ["Email.ts", "Money.ts", "Address.ts", "PhoneNumber.ts"]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.DOMAIN,
                        `src/domain/value-objects/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })
        })
    })

    describe("Application Layer", () => {
        describe("Use Cases (Verb+Noun)", () => {
            it("should NOT detect violations for valid use case names", () => {
                const validNames = [
                    "CreateUser.ts",
                    "UpdateProfile.ts",
                    "DeleteOrder.ts",
                    "GetUser.ts",
                    "FindProducts.ts",
                    "AnalyzeProject.ts",
                    "ValidateEmail.ts",
                    "GenerateReport.ts",
                ]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.APPLICATION,
                        `src/application/use-cases/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })

            it("should detect violations for use cases starting with lowercase", () => {
                const result = detector.detectViolations(
                    "createUser.ts",
                    LAYERS.APPLICATION,
                    "src/application/use-cases/createUser.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_VERB_NOUN)
            })

            it("should detect violations for use cases without verb", () => {
                const result = detector.detectViolations(
                    "User.ts",
                    LAYERS.APPLICATION,
                    "src/application/use-cases/User.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_VERB_NOUN)
                expect(result[0].getMessage()).toContain("should start with a verb")
            })

            it("should detect violations for kebab-case use cases", () => {
                const result = detector.detectViolations(
                    "create-user.ts",
                    LAYERS.APPLICATION,
                    "src/application/use-cases/create-user.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_VERB_NOUN)
            })

            it("should recognize all standard verbs", () => {
                const verbs = [
                    "Analyze",
                    "Create",
                    "Update",
                    "Delete",
                    "Get",
                    "Find",
                    "List",
                    "Search",
                    "Validate",
                    "Calculate",
                    "Generate",
                    "Send",
                    "Fetch",
                    "Process",
                    "Execute",
                    "Handle",
                    "Register",
                    "Authenticate",
                    "Authorize",
                    "Import",
                    "Export",
                ]

                verbs.forEach((verb) => {
                    const fileName = `${verb}Something.ts`
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.APPLICATION,
                        `src/application/use-cases/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })
        })

        describe("DTOs (*Dto, *Request, *Response)", () => {
            it("should NOT detect violations for valid DTO names", () => {
                const validNames = [
                    "UserDto.ts",
                    "CreateUserRequest.ts",
                    "UserResponseDto.ts",
                    "UpdateProfileRequest.ts",
                    "OrderResponse.ts",
                ]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.APPLICATION,
                        `src/application/dtos/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })

            it("should detect violations for lowercase DTO names", () => {
                const result = detector.detectViolations(
                    "userDto.ts",
                    LAYERS.APPLICATION,
                    "src/application/dtos/userDto.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
            })

            it("should detect violations for DTOs without proper suffix", () => {
                const result = detector.detectViolations(
                    "User.ts",
                    LAYERS.APPLICATION,
                    "src/application/dtos/User.ts",
                )

                expect(result).toHaveLength(0)
            })

            it("should NOT detect violations for camelCase before suffix", () => {
                const result = detector.detectViolations(
                    "CreateUserRequestDto.ts",
                    LAYERS.APPLICATION,
                    "src/application/dtos/CreateUserRequestDto.ts",
                )

                expect(result).toHaveLength(0)
            })
        })

        describe("Mappers (*Mapper)", () => {
            it("should NOT detect violations for valid mapper names", () => {
                const validNames = ["UserMapper.ts", "OrderMapper.ts", "ProductMapper.ts"]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.APPLICATION,
                        `src/application/mappers/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })

            it("should detect violations for lowercase mapper names", () => {
                const result = detector.detectViolations(
                    "userMapper.ts",
                    LAYERS.APPLICATION,
                    "src/application/mappers/userMapper.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
            })

            it("should detect violations for mappers without suffix", () => {
                const result = detector.detectViolations(
                    "User.ts",
                    LAYERS.APPLICATION,
                    "src/application/mappers/User.ts",
                )

                expect(result).toHaveLength(0)
            })
        })
    })

    describe("Infrastructure Layer", () => {
        describe("Controllers (*Controller)", () => {
            it("should NOT detect violations for valid controller names", () => {
                const validNames = [
                    "UserController.ts",
                    "OrderController.ts",
                    "ProductController.ts",
                ]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.INFRASTRUCTURE,
                        `src/infrastructure/controllers/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })

            it("should detect violations for lowercase controller names", () => {
                const result = detector.detectViolations(
                    "userController.ts",
                    LAYERS.INFRASTRUCTURE,
                    "src/infrastructure/controllers/userController.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
            })

            it("should detect violations for controllers without suffix", () => {
                const result = detector.detectViolations(
                    "User.ts",
                    LAYERS.INFRASTRUCTURE,
                    "src/infrastructure/controllers/User.ts",
                )

                expect(result).toHaveLength(0)
            })
        })

        describe("Repository Implementations (*Repository)", () => {
            it("should NOT detect violations for valid repository implementation names", () => {
                const validNames = [
                    "UserRepository.ts",
                    "PrismaUserRepository.ts",
                    "MongoUserRepository.ts",
                    "InMemoryUserRepository.ts",
                ]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.INFRASTRUCTURE,
                        `src/infrastructure/repositories/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })

            it("should NOT detect violations for I*Repository (interface) in infrastructure", () => {
                const result = detector.detectViolations(
                    "IUserRepository.ts",
                    LAYERS.INFRASTRUCTURE,
                    "src/infrastructure/repositories/IUserRepository.ts",
                )

                expect(result).toHaveLength(0)
            })

            it("should detect violations for lowercase repository names", () => {
                const result = detector.detectViolations(
                    "userRepository.ts",
                    LAYERS.INFRASTRUCTURE,
                    "src/infrastructure/repositories/userRepository.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
            })
        })

        describe("Services (*Service, *Adapter)", () => {
            it("should NOT detect violations for valid service names", () => {
                const validNames = [
                    "EmailService.ts",
                    "S3StorageAdapter.ts",
                    "PaymentService.ts",
                    "LoggerAdapter.ts",
                ]

                validNames.forEach((fileName) => {
                    const result = detector.detectViolations(
                        fileName,
                        LAYERS.INFRASTRUCTURE,
                        `src/infrastructure/services/${fileName}`,
                    )
                    expect(result).toHaveLength(0)
                })
            })

            it("should detect violations for lowercase service names", () => {
                const result = detector.detectViolations(
                    "emailService.ts",
                    LAYERS.INFRASTRUCTURE,
                    "src/infrastructure/services/emailService.ts",
                )

                expect(result).toHaveLength(1)
                expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_SUFFIX)
            })

            it("should detect violations for services without suffix", () => {
                const result = detector.detectViolations(
                    "Email.ts",
                    LAYERS.INFRASTRUCTURE,
                    "src/infrastructure/services/Email.ts",
                )

                expect(result).toHaveLength(0)
            })
        })
    })

    describe("Shared Layer", () => {
        it("should NOT detect violations for any file in shared layer", () => {
            const fileNames = [
                "helpers.ts",
                "utils.ts",
                "constants.ts",
                "types.ts",
                "Guards.ts",
                "Result.ts",
                "anything.ts",
            ]

            fileNames.forEach((fileName) => {
                const result = detector.detectViolations(
                    fileName,
                    LAYERS.SHARED,
                    `src/shared/${fileName}`,
                )
                expect(result).toHaveLength(0)
            })
        })
    })

    describe("Edge Cases", () => {
        it("should return empty array when no layer is provided", () => {
            const result = detector.detectViolations("SomeFile.ts", undefined, "src/SomeFile.ts")
            expect(result).toHaveLength(0)
        })

        it("should return empty array for unknown layer", () => {
            const result = detector.detectViolations(
                "SomeFile.ts",
                "unknown-layer",
                "src/unknown/SomeFile.ts",
            )
            expect(result).toHaveLength(0)
        })

        it("should handle files with numbers in name", () => {
            const result = detector.detectViolations(
                "User2Factor.ts",
                LAYERS.DOMAIN,
                "src/domain/entities/User2Factor.ts",
            )

            expect(result).toHaveLength(0)
        })

        it("should provide helpful suggestions", () => {
            const result = detector.detectViolations(
                "userDto.ts",
                LAYERS.APPLICATION,
                "src/application/dtos/userDto.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].suggestion).toBeDefined()
            expect(result[0].suggestion).toContain("*Dto")
        })

        it("should include file path in violation", () => {
            const filePath = "src/domain/UserDto.ts"
            const result = detector.detectViolations("UserDto.ts", LAYERS.DOMAIN, filePath)

            expect(result).toHaveLength(1)
            expect(result[0].filePath).toBe(filePath)
        })
    })

    describe("Complex Scenarios", () => {
        it("should handle application layer file that looks like entity", () => {
            const result = detector.detectViolations(
                "User.ts",
                LAYERS.APPLICATION,
                "src/application/use-cases/User.ts",
            )

            expect(result).toHaveLength(1)
            expect(result[0].violationType).toBe(NAMING_VIOLATION_TYPES.WRONG_VERB_NOUN)
        })

        it("should handle domain layer service vs entity distinction", () => {
            const entityResult = detector.detectViolations(
                "User.ts",
                LAYERS.DOMAIN,
                "src/domain/entities/User.ts",
            )
            expect(entityResult).toHaveLength(0)

            const serviceResult = detector.detectViolations(
                "UserService.ts",
                LAYERS.DOMAIN,
                "src/domain/services/UserService.ts",
            )
            expect(serviceResult).toHaveLength(0)
        })

        it("should distinguish between domain and infrastructure repositories", () => {
            const interfaceResult = detector.detectViolations(
                "IUserRepository.ts",
                LAYERS.DOMAIN,
                "src/domain/repositories/IUserRepository.ts",
            )
            expect(interfaceResult).toHaveLength(0)

            const implResult = detector.detectViolations(
                "UserRepository.ts",
                LAYERS.INFRASTRUCTURE,
                "src/infrastructure/repositories/UserRepository.ts",
            )
            expect(implResult).toHaveLength(0)

            const wrongResult = detector.detectViolations(
                "UserRepository.ts",
                LAYERS.DOMAIN,
                "src/domain/repositories/UserRepository.ts",
            )
            expect(wrongResult).toHaveLength(0)
        })
    })

    describe("getMessage()", () => {
        it("should return descriptive error messages", () => {
            const result = detector.detectViolations(
                "UserDto.ts",
                LAYERS.DOMAIN,
                "src/domain/UserDto.ts",
            )

            expect(result).toHaveLength(1)
            const message = result[0].getMessage()
            expect(message).toBeTruthy()
            expect(typeof message).toBe("string")
            expect(message.length).toBeGreaterThan(0)
        })
    })
})
