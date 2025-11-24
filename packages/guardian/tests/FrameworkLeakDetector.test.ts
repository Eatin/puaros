import { describe, it, expect, beforeEach } from "vitest"
import { FrameworkLeakDetector } from "../src/infrastructure/analyzers/FrameworkLeakDetector"

describe("FrameworkLeakDetector", () => {
    let detector: FrameworkLeakDetector

    beforeEach(() => {
        detector = new FrameworkLeakDetector()
    })

    describe("detectLeaks", () => {
        it("should detect ORM framework leak in domain layer", () => {
            const imports = ["@prisma/client", "../entities/User"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks).toHaveLength(1)
            expect(leaks[0].packageName).toBe("@prisma/client")
            expect(leaks[0].category).toBe("ORM")
            expect(leaks[0].layer).toBe("domain")
            expect(leaks[0].filePath).toBe("src/domain/User.ts")
        })

        it("should detect web framework leak in domain layer", () => {
            const imports = ["express", "./UserService"]
            const leaks = detector.detectLeaks(
                imports,
                "src/domain/services/UserService.ts",
                "domain",
            )

            expect(leaks).toHaveLength(1)
            expect(leaks[0].packageName).toBe("express")
            expect(leaks[0].category).toBe("WEB_FRAMEWORK")
        })

        it("should detect multiple framework leaks", () => {
            const imports = ["@prisma/client", "express", "axios", "../entities/User"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks).toHaveLength(3)
            expect(leaks[0].packageName).toBe("@prisma/client")
            expect(leaks[1].packageName).toBe("express")
            expect(leaks[2].packageName).toBe("axios")
        })

        it("should not detect leaks in infrastructure layer", () => {
            const imports = ["@prisma/client", "express", "../domain/User"]
            const leaks = detector.detectLeaks(
                imports,
                "src/infrastructure/UserRepository.ts",
                "infrastructure",
            )

            expect(leaks).toHaveLength(0)
        })

        it("should not detect leaks in application layer", () => {
            const imports = ["express", "../domain/User"]
            const leaks = detector.detectLeaks(
                imports,
                "src/application/CreateUser.ts",
                "application",
            )

            expect(leaks).toHaveLength(0)
        })

        it("should not detect relative imports as leaks", () => {
            const imports = ["./UserService", "../entities/User", "../../shared/utils"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks).toHaveLength(0)
        })

        it("should handle empty imports", () => {
            const leaks = detector.detectLeaks([], "src/domain/User.ts", "domain")

            expect(leaks).toHaveLength(0)
        })

        it("should handle undefined layer", () => {
            const imports = ["@prisma/client"]
            const leaks = detector.detectLeaks(imports, "src/utils/helper.ts", undefined)

            expect(leaks).toHaveLength(0)
        })
    })

    describe("isFrameworkPackage", () => {
        it("should identify Prisma as framework package", () => {
            expect(detector.isFrameworkPackage("@prisma/client")).toBe(true)
        })

        it("should identify Express as framework package", () => {
            expect(detector.isFrameworkPackage("express")).toBe(true)
        })

        it("should identify Mongoose as framework package", () => {
            expect(detector.isFrameworkPackage("mongoose")).toBe(true)
        })

        it("should identify Axios as framework package", () => {
            expect(detector.isFrameworkPackage("axios")).toBe(true)
        })

        it("should not identify relative import as framework package", () => {
            expect(detector.isFrameworkPackage("./UserService")).toBe(false)
        })

        it("should not identify relative import as framework package", () => {
            expect(detector.isFrameworkPackage("../entities/User")).toBe(false)
        })

        it("should not identify non-framework package as framework", () => {
            expect(detector.isFrameworkPackage("lodash")).toBe(false)
        })

        it("should not identify Node.js built-ins as framework", () => {
            expect(detector.isFrameworkPackage("fs")).toBe(false)
            expect(detector.isFrameworkPackage("path")).toBe(false)
        })
    })

    describe("Framework Categories", () => {
        it("should detect TypeORM as ORM", () => {
            const imports = ["typeorm"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("ORM")
            expect(leaks[0].getCategoryDescription()).toBe("Database ORM/ODM")
        })

        it("should detect Knex as ORM", () => {
            const imports = ["knex"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("ORM")
        })

        it("should detect Fastify as web framework", () => {
            const imports = ["fastify"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("WEB_FRAMEWORK")
            expect(leaks[0].getCategoryDescription()).toBe("Web Framework")
        })

        it("should detect NestJS as web framework", () => {
            const imports = ["@nestjs/common"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("WEB_FRAMEWORK")
        })

        it("should detect Winston as logger", () => {
            const imports = ["winston"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("LOGGER")
            expect(leaks[0].getCategoryDescription()).toBe("Logger")
        })

        it("should detect Pino as logger", () => {
            const imports = ["pino"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("LOGGER")
        })

        it("should detect Redis as cache", () => {
            const imports = ["redis"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("CACHE")
            expect(leaks[0].getCategoryDescription()).toBe("Cache")
        })

        it("should detect cache-manager as cache", () => {
            const imports = ["cache-manager"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("CACHE")
        })

        it("should detect Joi as validation library", () => {
            const imports = ["joi"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("VALIDATION")
            expect(leaks[0].getCategoryDescription()).toBe("Validation Library")
        })

        it("should detect Nodemailer as email service", () => {
            const imports = ["nodemailer"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("EMAIL")
            expect(leaks[0].getCategoryDescription()).toBe("Email Service")
        })

        it("should detect Jest as testing framework", () => {
            const imports = ["jest"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("TESTING")
            expect(leaks[0].getCategoryDescription()).toBe("Testing Framework")
        })

        it("should detect EJS as template engine", () => {
            const imports = ["ejs"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("TEMPLATE_ENGINE")
            expect(leaks[0].getCategoryDescription()).toBe("Template Engine")
        })

        it("should detect Handlebars as template engine", () => {
            const imports = ["handlebars"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].category).toBe("TEMPLATE_ENGINE")
        })
    })

    describe("FrameworkLeak value object", () => {
        it("should have correct message", () => {
            const imports = ["@prisma/client"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].getMessage()).toContain("@prisma/client")
            expect(leaks[0].getMessage()).toContain(
                "Domain layer imports framework-specific package",
            )
        })

        it("should have suggestion", () => {
            const imports = ["express"]
            const leaks = detector.detectLeaks(imports, "src/domain/User.ts", "domain")

            expect(leaks[0].getSuggestion()).toContain("Create an interface in domain layer")
            expect(leaks[0].getSuggestion()).toContain("implement it in infrastructure layer")
        })
    })

    describe("Real-world scenarios", () => {
        it("should detect database leak in User entity", () => {
            const imports = [
                "@prisma/client",
                "../value-objects/Email",
                "../value-objects/Password",
            ]
            const leaks = detector.detectLeaks(imports, "src/domain/entities/User.ts", "domain")

            expect(leaks).toHaveLength(1)
            expect(leaks[0].packageName).toBe("@prisma/client")
        })

        it("should detect HTTP client in domain service", () => {
            const imports = ["axios", "./IUserRepository", "../entities/User"]
            const leaks = detector.detectLeaks(
                imports,
                "src/domain/services/UserService.ts",
                "domain",
            )

            expect(leaks).toHaveLength(1)
            expect(leaks[0].packageName).toBe("axios")
            expect(leaks[0].category).toBe("HTTP_CLIENT")
        })

        it("should allow framework in repository implementation", () => {
            const imports = [
                "@prisma/client",
                "../../domain/entities/User",
                "../../domain/repositories/IUserRepository",
            ]
            const leaks = detector.detectLeaks(
                imports,
                "src/infrastructure/repositories/PrismaUserRepository.ts",
                "infrastructure",
            )

            expect(leaks).toHaveLength(0)
        })

        it("should detect validation library in domain", () => {
            const imports = ["zod", "../entities/User"]
            const leaks = detector.detectLeaks(
                imports,
                "src/domain/value-objects/Email.ts",
                "domain",
            )

            expect(leaks).toHaveLength(1)
            expect(leaks[0].packageName).toBe("zod")
            expect(leaks[0].category).toBe("VALIDATION")
        })
    })
})
