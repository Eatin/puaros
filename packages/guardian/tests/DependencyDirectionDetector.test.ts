import { describe, it, expect } from "vitest"
import { DependencyDirectionDetector } from "../src/infrastructure/analyzers/DependencyDirectionDetector"
import { LAYERS } from "../src/shared/constants/rules"

describe("DependencyDirectionDetector", () => {
    const detector = new DependencyDirectionDetector()

    describe("extractLayerFromImport", () => {
        it("should extract domain layer from import path", () => {
            expect(detector.extractLayerFromImport("../domain/entities/User")).toBe(LAYERS.DOMAIN)
            expect(detector.extractLayerFromImport("../../domain/value-objects/Email")).toBe(
                LAYERS.DOMAIN,
            )
            expect(detector.extractLayerFromImport("../../../domain/services/UserService")).toBe(
                LAYERS.DOMAIN,
            )
        })

        it("should extract application layer from import path", () => {
            expect(detector.extractLayerFromImport("../application/use-cases/CreateUser")).toBe(
                LAYERS.APPLICATION,
            )
            expect(detector.extractLayerFromImport("../../application/dtos/UserDto")).toBe(
                LAYERS.APPLICATION,
            )
            expect(detector.extractLayerFromImport("../../../application/mappers/UserMapper")).toBe(
                LAYERS.APPLICATION,
            )
        })

        it("should extract infrastructure layer from import path", () => {
            expect(
                detector.extractLayerFromImport("../infrastructure/controllers/UserController"),
            ).toBe(LAYERS.INFRASTRUCTURE)
            expect(
                detector.extractLayerFromImport("../../infrastructure/repositories/UserRepository"),
            ).toBe(LAYERS.INFRASTRUCTURE)
        })

        it("should extract shared layer from import path", () => {
            expect(detector.extractLayerFromImport("../shared/types/Result")).toBe(LAYERS.SHARED)
            expect(detector.extractLayerFromImport("../../shared/constants/rules")).toBe(
                LAYERS.SHARED,
            )
        })

        it("should return undefined for non-layer imports", () => {
            expect(detector.extractLayerFromImport("express")).toBeUndefined()
            expect(detector.extractLayerFromImport("../utils/helper")).toBeUndefined()
            expect(detector.extractLayerFromImport("../../lib/logger")).toBeUndefined()
        })
    })

    describe("isViolation", () => {
        it("should allow domain to import from domain", () => {
            expect(detector.isViolation(LAYERS.DOMAIN, LAYERS.DOMAIN)).toBe(false)
        })

        it("should allow domain to import from shared", () => {
            expect(detector.isViolation(LAYERS.DOMAIN, LAYERS.SHARED)).toBe(false)
        })

        it("should NOT allow domain to import from application", () => {
            expect(detector.isViolation(LAYERS.DOMAIN, LAYERS.APPLICATION)).toBe(true)
        })

        it("should NOT allow domain to import from infrastructure", () => {
            expect(detector.isViolation(LAYERS.DOMAIN, LAYERS.INFRASTRUCTURE)).toBe(true)
        })

        it("should allow application to import from domain", () => {
            expect(detector.isViolation(LAYERS.APPLICATION, LAYERS.DOMAIN)).toBe(false)
        })

        it("should allow application to import from application", () => {
            expect(detector.isViolation(LAYERS.APPLICATION, LAYERS.APPLICATION)).toBe(false)
        })

        it("should allow application to import from shared", () => {
            expect(detector.isViolation(LAYERS.APPLICATION, LAYERS.SHARED)).toBe(false)
        })

        it("should NOT allow application to import from infrastructure", () => {
            expect(detector.isViolation(LAYERS.APPLICATION, LAYERS.INFRASTRUCTURE)).toBe(true)
        })

        it("should allow infrastructure to import from domain", () => {
            expect(detector.isViolation(LAYERS.INFRASTRUCTURE, LAYERS.DOMAIN)).toBe(false)
        })

        it("should allow infrastructure to import from application", () => {
            expect(detector.isViolation(LAYERS.INFRASTRUCTURE, LAYERS.APPLICATION)).toBe(false)
        })

        it("should allow infrastructure to import from infrastructure", () => {
            expect(detector.isViolation(LAYERS.INFRASTRUCTURE, LAYERS.INFRASTRUCTURE)).toBe(false)
        })

        it("should allow infrastructure to import from shared", () => {
            expect(detector.isViolation(LAYERS.INFRASTRUCTURE, LAYERS.SHARED)).toBe(false)
        })

        it("should allow shared to import from any layer", () => {
            expect(detector.isViolation(LAYERS.SHARED, LAYERS.DOMAIN)).toBe(false)
            expect(detector.isViolation(LAYERS.SHARED, LAYERS.APPLICATION)).toBe(false)
            expect(detector.isViolation(LAYERS.SHARED, LAYERS.INFRASTRUCTURE)).toBe(false)
            expect(detector.isViolation(LAYERS.SHARED, LAYERS.SHARED)).toBe(false)
        })
    })

    describe("detectViolations", () => {
        describe("Domain layer violations", () => {
            it("should detect domain importing from application", () => {
                const code = `
import { UserDto } from '../../application/dtos/UserDto'

export class User {
    constructor(private id: string) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
                expect(violations[0].fromLayer).toBe(LAYERS.DOMAIN)
                expect(violations[0].toLayer).toBe(LAYERS.APPLICATION)
                expect(violations[0].importPath).toBe("../../application/dtos/UserDto")
                expect(violations[0].line).toBe(2)
            })

            it("should detect domain importing from infrastructure", () => {
                const code = `
import { PrismaClient } from '../../infrastructure/database/PrismaClient'

export class UserRepository {
    constructor(private prisma: PrismaClient) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/repositories/UserRepository.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
                expect(violations[0].fromLayer).toBe(LAYERS.DOMAIN)
                expect(violations[0].toLayer).toBe(LAYERS.INFRASTRUCTURE)
                expect(violations[0].importPath).toBe("../../infrastructure/database/PrismaClient")
            })

            it("should NOT detect domain importing from domain", () => {
                const code = `
import { Email } from '../value-objects/Email'
import { UserId } from '../value-objects/UserId'

export class User {
    constructor(
        private id: UserId,
        private email: Email
    ) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })

            it("should NOT detect domain importing from shared", () => {
                const code = `
import { Result } from '../../shared/types/Result'

export class User {
    static create(id: string): Result<User> {
        return Result.ok(new User(id))
    }
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })
        })

        describe("Application layer violations", () => {
            it("should detect application importing from infrastructure", () => {
                const code = `
import { SmtpEmailService } from '../../infrastructure/email/SmtpEmailService'

export class SendWelcomeEmail {
    constructor(private emailService: SmtpEmailService) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/application/use-cases/SendWelcomeEmail.ts",
                    LAYERS.APPLICATION,
                )

                expect(violations).toHaveLength(1)
                expect(violations[0].fromLayer).toBe(LAYERS.APPLICATION)
                expect(violations[0].toLayer).toBe(LAYERS.INFRASTRUCTURE)
                expect(violations[0].getMessage()).toContain(
                    "Application layer should not import from Infrastructure layer",
                )
            })

            it("should NOT detect application importing from domain", () => {
                const code = `
import { User } from '../../domain/entities/User'
import { IUserRepository } from '../../domain/repositories/IUserRepository'

export class CreateUser {
    constructor(private userRepo: IUserRepository) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/application/use-cases/CreateUser.ts",
                    LAYERS.APPLICATION,
                )

                expect(violations).toHaveLength(0)
            })

            it("should NOT detect application importing from application", () => {
                const code = `
import { UserResponseDto } from '../dtos/UserResponseDto'
import { UserMapper } from '../mappers/UserMapper'

export class GetUser {
    execute(id: string): UserResponseDto {
        return UserMapper.toDto(user)
    }
}`
                const violations = detector.detectViolations(
                    code,
                    "src/application/use-cases/GetUser.ts",
                    LAYERS.APPLICATION,
                )

                expect(violations).toHaveLength(0)
            })

            it("should NOT detect application importing from shared", () => {
                const code = `
import { Result } from '../../shared/types/Result'

export class CreateUser {
    execute(): Result<User> {
        return Result.ok(user)
    }
}`
                const violations = detector.detectViolations(
                    code,
                    "src/application/use-cases/CreateUser.ts",
                    LAYERS.APPLICATION,
                )

                expect(violations).toHaveLength(0)
            })
        })

        describe("Infrastructure layer", () => {
            it("should NOT detect infrastructure importing from domain", () => {
                const code = `
import { User } from '../../domain/entities/User'
import { IUserRepository } from '../../domain/repositories/IUserRepository'

export class PrismaUserRepository implements IUserRepository {
    async save(user: User): Promise<void> {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/infrastructure/repositories/PrismaUserRepository.ts",
                    LAYERS.INFRASTRUCTURE,
                )

                expect(violations).toHaveLength(0)
            })

            it("should NOT detect infrastructure importing from application", () => {
                const code = `
import { CreateUser } from '../../application/use-cases/CreateUser'
import { UserResponseDto } from '../../application/dtos/UserResponseDto'

export class UserController {
    constructor(private createUser: CreateUser) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/infrastructure/controllers/UserController.ts",
                    LAYERS.INFRASTRUCTURE,
                )

                expect(violations).toHaveLength(0)
            })

            it("should NOT detect infrastructure importing from infrastructure", () => {
                const code = `
import { DatabaseConnection } from '../database/DatabaseConnection'

export class PrismaUserRepository {
    constructor(private db: DatabaseConnection) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/infrastructure/repositories/PrismaUserRepository.ts",
                    LAYERS.INFRASTRUCTURE,
                )

                expect(violations).toHaveLength(0)
            })
        })

        describe("Multiple violations", () => {
            it("should detect multiple violations in same file", () => {
                const code = `
import { UserDto } from '../../application/dtos/UserDto'
import { EmailService } from '../../infrastructure/email/EmailService'
import { Logger } from '../../infrastructure/logging/Logger'

export class User {
    constructor() {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(3)
                expect(violations[0].toLayer).toBe(LAYERS.APPLICATION)
                expect(violations[1].toLayer).toBe(LAYERS.INFRASTRUCTURE)
                expect(violations[2].toLayer).toBe(LAYERS.INFRASTRUCTURE)
            })
        })

        describe("Import statement formats", () => {
            it("should detect violations in named imports", () => {
                const code = `import { UserDto, UserRequest } from '../../application/dtos/UserDto'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
            })

            it("should detect violations in default imports", () => {
                const code = `import UserDto from '../../application/dtos/UserDto'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
            })

            it("should detect violations in namespace imports", () => {
                const code = `import * as Dtos from '../../application/dtos'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
            })

            it("should detect violations in require statements", () => {
                const code = `const UserDto = require('../../application/dtos/UserDto')`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
            })
        })

        describe("Edge cases", () => {
            it("should return empty array for shared layer", () => {
                const code = `
import { User } from '../../domain/entities/User'
import { CreateUser } from '../../application/use-cases/CreateUser'
`
                const violations = detector.detectViolations(
                    code,
                    "src/shared/types/Result.ts",
                    LAYERS.SHARED,
                )

                expect(violations).toHaveLength(0)
            })

            it("should return empty array for undefined layer", () => {
                const code = `import { UserDto } from '../../application/dtos/UserDto'`
                const violations = detector.detectViolations(code, "src/utils/helper.ts", undefined)

                expect(violations).toHaveLength(0)
            })

            it("should handle empty code", () => {
                const violations = detector.detectViolations(
                    "",
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })
        })

        describe("getMessage", () => {
            it("should return correct message for domain -> application violation", () => {
                const code = `import { UserDto } from '../../application/dtos/UserDto'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/User.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations[0].getMessage()).toBe(
                    "Domain layer should not import from Application layer",
                )
            })

            it("should return correct message for application -> infrastructure violation", () => {
                const code = `import { SmtpEmailService } from '../../infrastructure/email/SmtpEmailService'`
                const violations = detector.detectViolations(
                    code,
                    "src/application/use-cases/SendEmail.ts",
                    LAYERS.APPLICATION,
                )

                expect(violations[0].getMessage()).toBe(
                    "Application layer should not import from Infrastructure layer",
                )
            })
        })

        describe("getSuggestion", () => {
            it("should return suggestions for domain layer violations", () => {
                const code = `import { PrismaClient } from '../../infrastructure/database'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/services/UserService.ts",
                    LAYERS.DOMAIN,
                )

                const suggestion = violations[0].getSuggestion()
                expect(suggestion).toContain("Domain layer should be independent")
                expect(suggestion).toContain("dependency inversion")
            })

            it("should return suggestions for application layer violations", () => {
                const code = `import { SmtpEmailService } from '../../infrastructure/email/SmtpEmailService'`
                const violations = detector.detectViolations(
                    code,
                    "src/application/use-cases/SendEmail.ts",
                    LAYERS.APPLICATION,
                )

                const suggestion = violations[0].getSuggestion()
                expect(suggestion).toContain(
                    "Application layer should not depend on infrastructure",
                )
                expect(suggestion).toContain("Port")
                expect(suggestion).toContain("Adapter")
            })
        })

        describe("getExampleFix", () => {
            it("should return example fix for domain -> infrastructure violation", () => {
                const code = `import { PrismaClient } from '../../infrastructure/database'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/services/UserService.ts",
                    LAYERS.DOMAIN,
                )

                const example = violations[0].getExampleFix()
                expect(example).toContain("// ❌ Bad")
                expect(example).toContain("// ✅ Good")
                expect(example).toContain("IUserRepository")
            })

            it("should return example fix for application -> infrastructure violation", () => {
                const code = `import { SmtpEmailService } from '../../infrastructure/email/SmtpEmailService'`
                const violations = detector.detectViolations(
                    code,
                    "src/application/use-cases/SendEmail.ts",
                    LAYERS.APPLICATION,
                )

                const example = violations[0].getExampleFix()
                expect(example).toContain("// ❌ Bad")
                expect(example).toContain("// ✅ Good")
                expect(example).toContain("IEmailService")
            })
        })
    })
})
