import { describe, it, expect } from "vitest"
import {
    SYSTEM_PROMPT,
    buildInitialContext,
    buildFileContext,
    truncateContext,
    type ProjectStructure,
} from "../../../../src/infrastructure/llm/prompts.js"
import type { FileAST } from "../../../../src/domain/value-objects/FileAST.js"
import type { FileMeta } from "../../../../src/domain/value-objects/FileMeta.js"

describe("prompts", () => {
    describe("SYSTEM_PROMPT", () => {
        it("should be a non-empty string", () => {
            expect(typeof SYSTEM_PROMPT).toBe("string")
            expect(SYSTEM_PROMPT.length).toBeGreaterThan(100)
        })

        it("should contain core principles", () => {
            expect(SYSTEM_PROMPT).toContain("Lazy Loading")
            expect(SYSTEM_PROMPT).toContain("Precision")
            expect(SYSTEM_PROMPT).toContain("Safety")
        })

        it("should list available tools", () => {
            expect(SYSTEM_PROMPT).toContain("get_lines")
            expect(SYSTEM_PROMPT).toContain("edit_lines")
            expect(SYSTEM_PROMPT).toContain("find_references")
            expect(SYSTEM_PROMPT).toContain("git_status")
            expect(SYSTEM_PROMPT).toContain("run_command")
        })

        it("should include safety rules", () => {
            expect(SYSTEM_PROMPT).toContain("Safety Rules")
            expect(SYSTEM_PROMPT).toContain("Never execute commands that could harm")
        })
    })

    describe("buildInitialContext", () => {
        const structure: ProjectStructure = {
            name: "my-project",
            rootPath: "/home/user/my-project",
            files: ["src/index.ts", "src/utils.ts", "package.json"],
            directories: ["src", "tests"],
        }

        const asts = new Map<string, FileAST>([
            [
                "src/index.ts",
                {
                    imports: [],
                    exports: [],
                    functions: [
                        {
                            name: "main",
                            lineStart: 1,
                            lineEnd: 10,
                            params: [],
                            isAsync: false,
                            isExported: true,
                        },
                    ],
                    classes: [],
                    interfaces: [],
                    typeAliases: [],
                    parseError: false,
                },
            ],
            [
                "src/utils.ts",
                {
                    imports: [],
                    exports: [],
                    functions: [],
                    classes: [
                        {
                            name: "Helper",
                            lineStart: 1,
                            lineEnd: 20,
                            methods: [],
                            properties: [],
                            implements: [],
                            isExported: true,
                            isAbstract: false,
                        },
                    ],
                    interfaces: [],
                    typeAliases: [],
                    parseError: false,
                },
            ],
        ])

        it("should include project header", () => {
            const context = buildInitialContext(structure, asts)

            expect(context).toContain("# Project: my-project")
            expect(context).toContain("Root: /home/user/my-project")
            expect(context).toContain("Files: 3")
            expect(context).toContain("Directories: 2")
        })

        it("should include directory structure", () => {
            const context = buildInitialContext(structure, asts)

            expect(context).toContain("## Structure")
            expect(context).toContain("src/")
            expect(context).toContain("tests/")
        })

        it("should include file overview with AST summaries", () => {
            const context = buildInitialContext(structure, asts)

            expect(context).toContain("## Files")
            expect(context).toContain("src/index.ts")
            expect(context).toContain("fn: main")
            expect(context).toContain("src/utils.ts")
            expect(context).toContain("class: Helper")
        })

        it("should include file flags from metadata", () => {
            const metas = new Map<string, FileMeta>([
                [
                    "src/index.ts",
                    {
                        complexity: { loc: 100, nesting: 3, cyclomaticComplexity: 10, score: 75 },
                        dependencies: [],
                        dependents: ["a.ts", "b.ts", "c.ts", "d.ts", "e.ts", "f.ts"],
                        isHub: true,
                        isEntryPoint: true,
                        fileType: "source",
                    },
                ],
            ])

            const context = buildInitialContext(structure, asts, metas)

            expect(context).toContain("(hub, entry, complex)")
        })
    })

    describe("buildFileContext", () => {
        const ast: FileAST = {
            imports: [
                { name: "fs", from: "node:fs", line: 1, type: "builtin", isDefault: false },
                { name: "helper", from: "./helper", line: 2, type: "internal", isDefault: true },
            ],
            exports: [
                { name: "main", line: 10, isDefault: false, kind: "function" },
                { name: "Config", line: 20, isDefault: true, kind: "class" },
            ],
            functions: [
                {
                    name: "main",
                    lineStart: 10,
                    lineEnd: 30,
                    params: [
                        { name: "args", optional: false, hasDefault: false },
                        { name: "options", optional: true, hasDefault: false },
                    ],
                    isAsync: true,
                    isExported: true,
                },
            ],
            classes: [
                {
                    name: "Config",
                    lineStart: 40,
                    lineEnd: 80,
                    methods: [
                        {
                            name: "load",
                            lineStart: 50,
                            lineEnd: 60,
                            params: [],
                            isAsync: false,
                            visibility: "public",
                            isStatic: false,
                        },
                    ],
                    properties: [],
                    extends: "BaseConfig",
                    implements: ["IConfig"],
                    isExported: true,
                    isAbstract: false,
                },
            ],
            interfaces: [],
            typeAliases: [],
            parseError: false,
        }

        it("should include file path header", () => {
            const context = buildFileContext("src/index.ts", ast)

            expect(context).toContain("## src/index.ts")
        })

        it("should include imports section", () => {
            const context = buildFileContext("src/index.ts", ast)

            expect(context).toContain("### Imports")
            expect(context).toContain('fs from "node:fs" (builtin)')
            expect(context).toContain('helper from "./helper" (internal)')
        })

        it("should include exports section", () => {
            const context = buildFileContext("src/index.ts", ast)

            expect(context).toContain("### Exports")
            expect(context).toContain("function main")
            expect(context).toContain("class Config (default)")
        })

        it("should include functions section", () => {
            const context = buildFileContext("src/index.ts", ast)

            expect(context).toContain("### Functions")
            expect(context).toContain("async main(args, options)")
            expect(context).toContain("[10-30]")
        })

        it("should include classes section with methods", () => {
            const context = buildFileContext("src/index.ts", ast)

            expect(context).toContain("### Classes")
            expect(context).toContain("Config extends BaseConfig implements IConfig")
            expect(context).toContain("[40-80]")
            expect(context).toContain("load()")
        })

        it("should include metadata section when provided", () => {
            const meta: FileMeta = {
                complexity: { loc: 100, nesting: 3, cyclomaticComplexity: 10, score: 65 },
                dependencies: ["a.ts", "b.ts"],
                dependents: ["c.ts"],
                isHub: false,
                isEntryPoint: true,
                fileType: "source",
            }

            const context = buildFileContext("src/index.ts", ast, meta)

            expect(context).toContain("### Metadata")
            expect(context).toContain("LOC: 100")
            expect(context).toContain("Complexity: 65/100")
            expect(context).toContain("Dependencies: 2")
            expect(context).toContain("Dependents: 1")
        })
    })

    describe("truncateContext", () => {
        it("should return original context if within limit", () => {
            const context = "Short context"

            const result = truncateContext(context, 1000)

            expect(result).toBe(context)
        })

        it("should truncate long context", () => {
            const context = "a".repeat(1000)

            const result = truncateContext(context, 100)

            expect(result.length).toBeLessThan(500)
            expect(result).toContain("truncated")
        })

        it("should break at newline boundary", () => {
            const context = "Line 1\nLine 2\nLine 3\n" + "a".repeat(1000)

            const result = truncateContext(context, 50)

            expect(result).toContain("truncated")
        })
    })
})
