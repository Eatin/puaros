import { describe, it, expect } from "vitest"
import { ProjectPath } from "../../../src/domain/value-objects/ProjectPath"

describe("ProjectPath", () => {
    describe("create", () => {
        it("should create a ProjectPath with absolute and relative paths", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.absolute).toBe(absolutePath)
            expect(projectPath.relative).toBe("src/domain/User.ts")
        })

        it("should handle paths with same directory", () => {
            const absolutePath = "/Users/dev/project/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.absolute).toBe(absolutePath)
            expect(projectPath.relative).toBe("User.ts")
        })

        it("should handle nested directory structures", () => {
            const absolutePath = "/Users/dev/project/src/domain/entities/user/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.absolute).toBe(absolutePath)
            expect(projectPath.relative).toBe("src/domain/entities/user/User.ts")
        })

        it("should handle Windows-style paths", () => {
            const absolutePath = "C:\\Users\\dev\\project\\src\\domain\\User.ts"
            const projectRoot = "C:\\Users\\dev\\project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.absolute).toBe(absolutePath)
        })
    })

    describe("absolute getter", () => {
        it("should return the absolute path", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.absolute).toBe(absolutePath)
        })
    })

    describe("relative getter", () => {
        it("should return the relative path", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.relative).toBe("src/domain/User.ts")
        })
    })

    describe("extension getter", () => {
        it("should return .ts for TypeScript files", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.extension).toBe(".ts")
        })

        it("should return .tsx for TypeScript JSX files", () => {
            const absolutePath = "/Users/dev/project/src/components/Button.tsx"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.extension).toBe(".tsx")
        })

        it("should return .js for JavaScript files", () => {
            const absolutePath = "/Users/dev/project/src/utils/helper.js"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.extension).toBe(".js")
        })

        it("should return .jsx for JavaScript JSX files", () => {
            const absolutePath = "/Users/dev/project/src/components/Button.jsx"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.extension).toBe(".jsx")
        })

        it("should return empty string for files without extension", () => {
            const absolutePath = "/Users/dev/project/README"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.extension).toBe("")
        })
    })

    describe("filename getter", () => {
        it("should return the filename with extension", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.filename).toBe("User.ts")
        })

        it("should handle filenames with multiple dots", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.test.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.filename).toBe("User.test.ts")
        })

        it("should handle filenames without extension", () => {
            const absolutePath = "/Users/dev/project/README"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.filename).toBe("README")
        })
    })

    describe("directory getter", () => {
        it("should return the directory path relative to project root", () => {
            const absolutePath = "/Users/dev/project/src/domain/entities/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.directory).toBe("src/domain/entities")
        })

        it("should return dot for files in project root", () => {
            const absolutePath = "/Users/dev/project/README.md"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.directory).toBe(".")
        })

        it("should handle single-level directories", () => {
            const absolutePath = "/Users/dev/project/src/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.directory).toBe("src")
        })
    })

    describe("isTypeScript", () => {
        it("should return true for .ts files", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isTypeScript()).toBe(true)
        })

        it("should return true for .tsx files", () => {
            const absolutePath = "/Users/dev/project/src/components/Button.tsx"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isTypeScript()).toBe(true)
        })

        it("should return false for .js files", () => {
            const absolutePath = "/Users/dev/project/src/utils/helper.js"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isTypeScript()).toBe(false)
        })

        it("should return false for .jsx files", () => {
            const absolutePath = "/Users/dev/project/src/components/Button.jsx"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isTypeScript()).toBe(false)
        })

        it("should return false for other file types", () => {
            const absolutePath = "/Users/dev/project/README.md"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isTypeScript()).toBe(false)
        })
    })

    describe("isJavaScript", () => {
        it("should return true for .js files", () => {
            const absolutePath = "/Users/dev/project/src/utils/helper.js"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isJavaScript()).toBe(true)
        })

        it("should return true for .jsx files", () => {
            const absolutePath = "/Users/dev/project/src/components/Button.jsx"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isJavaScript()).toBe(true)
        })

        it("should return false for .ts files", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.ts"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isJavaScript()).toBe(false)
        })

        it("should return false for .tsx files", () => {
            const absolutePath = "/Users/dev/project/src/components/Button.tsx"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isJavaScript()).toBe(false)
        })

        it("should return false for other file types", () => {
            const absolutePath = "/Users/dev/project/README.md"
            const projectRoot = "/Users/dev/project"

            const projectPath = ProjectPath.create(absolutePath, projectRoot)

            expect(projectPath.isJavaScript()).toBe(false)
        })
    })

    describe("equals", () => {
        it("should return true for identical paths", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.ts"
            const projectRoot = "/Users/dev/project"

            const path1 = ProjectPath.create(absolutePath, projectRoot)
            const path2 = ProjectPath.create(absolutePath, projectRoot)

            expect(path1.equals(path2)).toBe(true)
        })

        it("should return false for different absolute paths", () => {
            const projectRoot = "/Users/dev/project"
            const path1 = ProjectPath.create("/Users/dev/project/src/domain/User.ts", projectRoot)
            const path2 = ProjectPath.create("/Users/dev/project/src/domain/Order.ts", projectRoot)

            expect(path1.equals(path2)).toBe(false)
        })

        it("should return false for different relative paths", () => {
            const path1 = ProjectPath.create(
                "/Users/dev/project1/src/User.ts",
                "/Users/dev/project1",
            )
            const path2 = ProjectPath.create(
                "/Users/dev/project2/src/User.ts",
                "/Users/dev/project2",
            )

            expect(path1.equals(path2)).toBe(false)
        })

        it("should return false when comparing with undefined", () => {
            const absolutePath = "/Users/dev/project/src/domain/User.ts"
            const projectRoot = "/Users/dev/project"

            const path1 = ProjectPath.create(absolutePath, projectRoot)

            expect(path1.equals(undefined)).toBe(false)
        })
    })
})
