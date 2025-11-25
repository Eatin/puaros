import { describe, it, expect } from "vitest"
import { SourceFile } from "../../../src/domain/entities/SourceFile"
import { ProjectPath } from "../../../src/domain/value-objects/ProjectPath"
import { LAYERS } from "../../../src/shared/constants/rules"

describe("SourceFile", () => {
    describe("constructor", () => {
        it("should create a SourceFile instance with all properties", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const content = "class User {}"
            const imports = ["./BaseEntity"]
            const exports = ["User"]
            const id = "test-id"

            const sourceFile = new SourceFile(path, content, imports, exports, id)

            expect(sourceFile.path).toBe(path)
            expect(sourceFile.content).toBe(content)
            expect(sourceFile.imports).toEqual(imports)
            expect(sourceFile.exports).toEqual(exports)
            expect(sourceFile.id).toBe(id)
        })

        it("should create a SourceFile with empty imports and exports by default", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const content = "class User {}"

            const sourceFile = new SourceFile(path, content)

            expect(sourceFile.imports).toEqual([])
            expect(sourceFile.exports).toEqual([])
        })

        it("should generate an id if not provided", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const content = "class User {}"

            const sourceFile = new SourceFile(path, content)

            expect(sourceFile.id).toBeDefined()
            expect(typeof sourceFile.id).toBe("string")
            expect(sourceFile.id.length).toBeGreaterThan(0)
        })
    })

    describe("layer detection", () => {
        it("should detect domain layer from path", () => {
            const path = ProjectPath.create("/project/src/domain/entities/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            expect(sourceFile.layer).toBe(LAYERS.DOMAIN)
        })

        it("should detect application layer from path", () => {
            const path = ProjectPath.create(
                "/project/src/application/use-cases/CreateUser.ts",
                "/project",
            )
            const sourceFile = new SourceFile(path, "")

            expect(sourceFile.layer).toBe(LAYERS.APPLICATION)
        })

        it("should detect infrastructure layer from path", () => {
            const path = ProjectPath.create(
                "/project/src/infrastructure/database/UserRepository.ts",
                "/project",
            )
            const sourceFile = new SourceFile(path, "")

            expect(sourceFile.layer).toBe(LAYERS.INFRASTRUCTURE)
        })

        it("should detect shared layer from path", () => {
            const path = ProjectPath.create("/project/src/shared/utils/helpers.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            expect(sourceFile.layer).toBe(LAYERS.SHARED)
        })

        it("should return undefined for unknown layer", () => {
            const path = ProjectPath.create("/project/src/unknown/Test.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            expect(sourceFile.layer).toBeUndefined()
        })

        it("should handle uppercase layer names in path", () => {
            const path = ProjectPath.create("/project/src/DOMAIN/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            expect(sourceFile.layer).toBe(LAYERS.DOMAIN)
        })

        it("should handle mixed case layer names in path", () => {
            const path = ProjectPath.create("/project/src/Application/UseCase.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            expect(sourceFile.layer).toBe(LAYERS.APPLICATION)
        })
    })

    describe("path getter", () => {
        it("should return the project path", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            expect(sourceFile.path).toBe(path)
        })
    })

    describe("content getter", () => {
        it("should return the file content", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const content = "class User { constructor(public name: string) {} }"
            const sourceFile = new SourceFile(path, content)

            expect(sourceFile.content).toBe(content)
        })
    })

    describe("imports getter", () => {
        it("should return a copy of imports array", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const imports = ["./BaseEntity", "./ValueObject"]
            const sourceFile = new SourceFile(path, "", imports)

            const returnedImports = sourceFile.imports

            expect(returnedImports).toEqual(imports)
            expect(returnedImports).not.toBe(imports)
        })

        it("should not allow mutations of internal imports array", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const imports = ["./BaseEntity"]
            const sourceFile = new SourceFile(path, "", imports)

            const returnedImports = sourceFile.imports
            returnedImports.push("./NewImport")

            expect(sourceFile.imports).toEqual(["./BaseEntity"])
        })
    })

    describe("exports getter", () => {
        it("should return a copy of exports array", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const exports = ["User", "UserProps"]
            const sourceFile = new SourceFile(path, "", [], exports)

            const returnedExports = sourceFile.exports

            expect(returnedExports).toEqual(exports)
            expect(returnedExports).not.toBe(exports)
        })

        it("should not allow mutations of internal exports array", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const exports = ["User"]
            const sourceFile = new SourceFile(path, "", [], exports)

            const returnedExports = sourceFile.exports
            returnedExports.push("NewExport")

            expect(sourceFile.exports).toEqual(["User"])
        })
    })

    describe("addImport", () => {
        it("should add a new import to the list", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            sourceFile.addImport("./BaseEntity")

            expect(sourceFile.imports).toEqual(["./BaseEntity"])
        })

        it("should not add duplicate imports", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "", ["./BaseEntity"])

            sourceFile.addImport("./BaseEntity")

            expect(sourceFile.imports).toEqual(["./BaseEntity"])
        })

        it("should update updatedAt timestamp when adding new import", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            const originalUpdatedAt = sourceFile.updatedAt

            setTimeout(() => {
                sourceFile.addImport("./BaseEntity")

                expect(sourceFile.updatedAt.getTime()).toBeGreaterThanOrEqual(
                    originalUpdatedAt.getTime(),
                )
            }, 10)
        })

        it("should not update timestamp when adding duplicate import", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "", ["./BaseEntity"])

            const originalUpdatedAt = sourceFile.updatedAt

            setTimeout(() => {
                sourceFile.addImport("./BaseEntity")

                expect(sourceFile.updatedAt).toBe(originalUpdatedAt)
            }, 10)
        })

        it("should add multiple different imports", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            sourceFile.addImport("./BaseEntity")
            sourceFile.addImport("./ValueObject")
            sourceFile.addImport("./DomainEvent")

            expect(sourceFile.imports).toEqual(["./BaseEntity", "./ValueObject", "./DomainEvent"])
        })
    })

    describe("addExport", () => {
        it("should add a new export to the list", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            sourceFile.addExport("User")

            expect(sourceFile.exports).toEqual(["User"])
        })

        it("should not add duplicate exports", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "", [], ["User"])

            sourceFile.addExport("User")

            expect(sourceFile.exports).toEqual(["User"])
        })

        it("should update updatedAt timestamp when adding new export", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            const originalUpdatedAt = sourceFile.updatedAt

            setTimeout(() => {
                sourceFile.addExport("User")

                expect(sourceFile.updatedAt.getTime()).toBeGreaterThanOrEqual(
                    originalUpdatedAt.getTime(),
                )
            }, 10)
        })

        it("should not update timestamp when adding duplicate export", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "", [], ["User"])

            const originalUpdatedAt = sourceFile.updatedAt

            setTimeout(() => {
                sourceFile.addExport("User")

                expect(sourceFile.updatedAt).toBe(originalUpdatedAt)
            }, 10)
        })

        it("should add multiple different exports", () => {
            const path = ProjectPath.create("/project/src/domain/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            sourceFile.addExport("User")
            sourceFile.addExport("UserProps")
            sourceFile.addExport("UserFactory")

            expect(sourceFile.exports).toEqual(["User", "UserProps", "UserFactory"])
        })
    })

    describe("importsFrom", () => {
        it("should return true if imports contain the specified layer", () => {
            const path = ProjectPath.create("/project/src/application/User.ts", "/project")
            const imports = ["../../domain/entities/User", "../use-cases/CreateUser"]
            const sourceFile = new SourceFile(path, "", imports)

            expect(sourceFile.importsFrom("domain")).toBe(true)
        })

        it("should return false if imports do not contain the specified layer", () => {
            const path = ProjectPath.create("/project/src/application/User.ts", "/project")
            const imports = ["../use-cases/CreateUser", "../dtos/UserDto"]
            const sourceFile = new SourceFile(path, "", imports)

            expect(sourceFile.importsFrom("domain")).toBe(false)
        })

        it("should be case-insensitive", () => {
            const path = ProjectPath.create("/project/src/application/User.ts", "/project")
            const imports = ["../../DOMAIN/entities/User"]
            const sourceFile = new SourceFile(path, "", imports)

            expect(sourceFile.importsFrom("domain")).toBe(true)
        })

        it("should return false for empty imports", () => {
            const path = ProjectPath.create("/project/src/application/User.ts", "/project")
            const sourceFile = new SourceFile(path, "")

            expect(sourceFile.importsFrom("domain")).toBe(false)
        })

        it("should handle partial matches in import paths", () => {
            const path = ProjectPath.create("/project/src/application/User.ts", "/project")
            const imports = ["../../infrastructure/database/UserRepository"]
            const sourceFile = new SourceFile(path, "", imports)

            expect(sourceFile.importsFrom("infrastructure")).toBe(true)
            expect(sourceFile.importsFrom("domain")).toBe(false)
        })
    })
})
