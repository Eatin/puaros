import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    FindReferencesTool,
    type FindReferencesResult,
} from "../../../../../src/infrastructure/tools/search/FindReferencesTool.js"
import type { ToolContext } from "../../../../../src/domain/services/ITool.js"
import type {
    IStorage,
    SymbolIndex,
    SymbolLocation,
} from "../../../../../src/domain/services/IStorage.js"
import type { FileData } from "../../../../../src/domain/value-objects/FileData.js"

function createMockFileData(lines: string[]): FileData {
    return {
        lines,
        hash: "abc123",
        size: lines.join("\n").length,
        lastModified: Date.now(),
    }
}

function createMockStorage(
    files: Map<string, FileData> = new Map(),
    symbolIndex: SymbolIndex = new Map(),
): IStorage {
    return {
        getFile: vi.fn().mockImplementation((p: string) => Promise.resolve(files.get(p) ?? null)),
        setFile: vi.fn(),
        deleteFile: vi.fn(),
        getAllFiles: vi.fn().mockResolvedValue(files),
        getFileCount: vi.fn().mockResolvedValue(files.size),
        getAST: vi.fn().mockResolvedValue(null),
        setAST: vi.fn(),
        deleteAST: vi.fn(),
        getAllASTs: vi.fn().mockResolvedValue(new Map()),
        getMeta: vi.fn().mockResolvedValue(null),
        setMeta: vi.fn(),
        deleteMeta: vi.fn(),
        getAllMetas: vi.fn().mockResolvedValue(new Map()),
        getSymbolIndex: vi.fn().mockResolvedValue(symbolIndex),
        setSymbolIndex: vi.fn(),
        getDepsGraph: vi.fn().mockResolvedValue({ imports: new Map(), importedBy: new Map() }),
        setDepsGraph: vi.fn(),
        getProjectConfig: vi.fn(),
        setProjectConfig: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: vi.fn().mockReturnValue(true),
        clear: vi.fn(),
    } as unknown as IStorage
}

function createMockContext(storage?: IStorage): ToolContext {
    return {
        projectRoot: "/test/project",
        storage: storage ?? createMockStorage(),
        requestConfirmation: vi.fn().mockResolvedValue(true),
        onProgress: vi.fn(),
    }
}

describe("FindReferencesTool", () => {
    let tool: FindReferencesTool

    beforeEach(() => {
        tool = new FindReferencesTool()
    })

    describe("metadata", () => {
        it("should have correct name", () => {
            expect(tool.name).toBe("find_references")
        })

        it("should have correct category", () => {
            expect(tool.category).toBe("search")
        })

        it("should not require confirmation", () => {
            expect(tool.requiresConfirmation).toBe(false)
        })

        it("should have correct parameters", () => {
            expect(tool.parameters).toHaveLength(2)
            expect(tool.parameters[0].name).toBe("symbol")
            expect(tool.parameters[0].required).toBe(true)
            expect(tool.parameters[1].name).toBe("path")
            expect(tool.parameters[1].required).toBe(false)
        })

        it("should have description", () => {
            expect(tool.description).toContain("Find all usages")
        })
    })

    describe("validateParams", () => {
        it("should return null for valid params with symbol only", () => {
            expect(tool.validateParams({ symbol: "myFunction" })).toBeNull()
        })

        it("should return null for valid params with symbol and path", () => {
            expect(tool.validateParams({ symbol: "myFunction", path: "src/" })).toBeNull()
        })

        it("should return error for missing symbol", () => {
            expect(tool.validateParams({})).toBe(
                "Parameter 'symbol' is required and must be a non-empty string",
            )
        })

        it("should return error for empty symbol", () => {
            expect(tool.validateParams({ symbol: "" })).toBe(
                "Parameter 'symbol' is required and must be a non-empty string",
            )
        })

        it("should return error for whitespace-only symbol", () => {
            expect(tool.validateParams({ symbol: "   " })).toBe(
                "Parameter 'symbol' is required and must be a non-empty string",
            )
        })

        it("should return error for non-string path", () => {
            expect(tool.validateParams({ symbol: "test", path: 123 })).toBe(
                "Parameter 'path' must be a string",
            )
        })
    })

    describe("execute", () => {
        it("should find simple symbol references", async () => {
            const files = new Map<string, FileData>([
                [
                    "src/index.ts",
                    createMockFileData([
                        "import { myFunction } from './utils'",
                        "",
                        "myFunction()",
                        "const result = myFunction(42)",
                    ]),
                ],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "myFunction" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.symbol).toBe("myFunction")
            expect(data.totalReferences).toBe(3)
            expect(data.files).toBe(1)
            expect(data.references).toHaveLength(3)
        })

        it("should find references across multiple files", async () => {
            const files = new Map<string, FileData>([
                ["src/a.ts", createMockFileData(["const foo = 1", "console.log(foo)"])],
                [
                    "src/b.ts",
                    createMockFileData(["import { foo } from './a'", "export const bar = foo + 1"]),
                ],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(4)
            expect(data.files).toBe(2)
        })

        it("should include definition locations from symbol index", async () => {
            const files = new Map<string, FileData>([
                ["src/utils.ts", createMockFileData(["export function helper() {}", "helper()"])],
            ])
            const symbolIndex: SymbolIndex = new Map([
                ["helper", [{ path: "src/utils.ts", line: 1, type: "function" as const }]],
            ])
            const storage = createMockStorage(files, symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "helper" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.definitionLocations).toHaveLength(1)
            expect(data.definitionLocations[0]).toEqual({
                path: "src/utils.ts",
                line: 1,
                type: "function",
            })
        })

        it("should mark definition lines", async () => {
            const files = new Map<string, FileData>([
                ["src/utils.ts", createMockFileData(["export function myFunc() {}", "myFunc()"])],
            ])
            const symbolIndex: SymbolIndex = new Map([
                ["myFunc", [{ path: "src/utils.ts", line: 1, type: "function" as const }]],
            ])
            const storage = createMockStorage(files, symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "myFunc" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.references[0].isDefinition).toBe(true)
            expect(data.references[1].isDefinition).toBe(false)
        })

        it("should filter by path", async () => {
            const files = new Map<string, FileData>([
                ["src/a.ts", createMockFileData(["const x = 1"])],
                ["src/b.ts", createMockFileData(["const x = 2"])],
                ["lib/c.ts", createMockFileData(["const x = 3"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x", path: "src" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(2)
            expect(data.references.every((r) => r.path.startsWith("src/"))).toBe(true)
        })

        it("should filter by specific file path", async () => {
            const files = new Map<string, FileData>([
                ["src/a.ts", createMockFileData(["const x = 1"])],
                ["src/b.ts", createMockFileData(["const x = 2"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x", path: "src/a.ts" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(1)
            expect(data.references[0].path).toBe("src/a.ts")
        })

        it("should return empty result when no files match filter", async () => {
            const files = new Map<string, FileData>([
                ["src/a.ts", createMockFileData(["const x = 1"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x", path: "nonexistent" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(0)
            expect(data.files).toBe(0)
        })

        it("should return empty result when symbol not found", async () => {
            const files = new Map<string, FileData>([
                ["src/a.ts", createMockFileData(["const foo = 1"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "bar" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(0)
            expect(data.files).toBe(0)
        })

        it("should use word boundaries for matching", async () => {
            const files = new Map<string, FileData>([
                [
                    "src/test.ts",
                    createMockFileData([
                        "const foo = 1",
                        "const foobar = 2",
                        "const barfoo = 3",
                        "const xfoox = 4",
                    ]),
                ],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(1)
            expect(data.references[0].line).toBe(1)
        })

        it("should include column number", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const value = 1", "    value = 2"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "value" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.references[0].column).toBe(7)
            expect(data.references[1].column).toBe(5)
        })

        it("should include context lines", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["// comment", "const foo = 1", "// after"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            const context = data.references[0].context
            expect(context).toContain("// comment")
            expect(context).toContain("const foo = 1")
            expect(context).toContain("// after")
        })

        it("should mark current line in context", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["line1", "const foo = 1", "line3"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            const context = data.references[0].context
            expect(context).toContain(">   2│const foo = 1")
            expect(context).toContain("    1│line1")
        })

        it("should handle context at file start", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const foo = 1", "line2"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            const context = data.references[0].context
            expect(context).toContain(">   1│const foo = 1")
            expect(context).toContain("    2│line2")
        })

        it("should handle context at file end", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["line1", "const foo = 1"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            const context = data.references[0].context
            expect(context).toContain("    1│line1")
            expect(context).toContain(">   2│const foo = 1")
        })

        it("should find multiple occurrences on same line", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const x = x + x"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(3)
            expect(data.references[0].column).toBe(7)
            expect(data.references[1].column).toBe(11)
            expect(data.references[2].column).toBe(15)
        })

        it("should sort results by path then line", async () => {
            const files = new Map<string, FileData>([
                ["src/b.ts", createMockFileData(["x", "", "x"])],
                ["src/a.ts", createMockFileData(["x"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.references[0].path).toBe("src/a.ts")
            expect(data.references[1].path).toBe("src/b.ts")
            expect(data.references[1].line).toBe(1)
            expect(data.references[2].path).toBe("src/b.ts")
            expect(data.references[2].line).toBe(3)
        })

        it("should handle special regex characters in symbol", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const $value = 1", "$value + 2"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "$value" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(2)
        })

        it("should include callId in result", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const x = 1"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x" }, ctx)

            expect(result.callId).toMatch(/^find_references-\d+$/)
        })

        it("should include execution time in result", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const x = 1"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x" }, ctx)

            expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
        })

        it("should handle storage errors gracefully", async () => {
            const storage = createMockStorage()
            ;(storage.getSymbolIndex as ReturnType<typeof vi.fn>).mockRejectedValue(
                new Error("Redis connection failed"),
            )
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "test" }, ctx)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Redis connection failed")
        })

        it("should trim symbol before searching", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const foo = 1"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "  foo  " }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.symbol).toBe("foo")
            expect(data.totalReferences).toBe(1)
        })

        it("should handle empty files", async () => {
            const files = new Map<string, FileData>([
                ["src/empty.ts", createMockFileData([])],
                ["src/test.ts", createMockFileData(["const x = 1"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(1)
        })

        it("should handle symbols with underscores", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const my_variable = 1", "my_variable + 1"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "my_variable" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(2)
        })

        it("should handle symbols with numbers", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const value1 = 1", "value1 + value2"])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "value1" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(2)
        })

        it("should handle class method references", async () => {
            const files = new Map<string, FileData>([
                [
                    "src/test.ts",
                    createMockFileData([
                        "class Foo {",
                        "    bar() {}",
                        "}",
                        "const f = new Foo()",
                        "f.bar()",
                    ]),
                ],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "bar" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(2)
        })

        it("should not match partial words in strings", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const foo = 1", 'const msg = "foobar"'])],
            ])
            const storage = createMockStorage(files)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindReferencesResult
            expect(data.totalReferences).toBe(1)
            expect(data.references[0].line).toBe(1)
        })
    })
})
