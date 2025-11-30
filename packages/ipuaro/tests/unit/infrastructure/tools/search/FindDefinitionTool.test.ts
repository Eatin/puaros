import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    FindDefinitionTool,
    type FindDefinitionResult,
} from "../../../../../src/infrastructure/tools/search/FindDefinitionTool.js"
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

describe("FindDefinitionTool", () => {
    let tool: FindDefinitionTool

    beforeEach(() => {
        tool = new FindDefinitionTool()
    })

    describe("metadata", () => {
        it("should have correct name", () => {
            expect(tool.name).toBe("find_definition")
        })

        it("should have correct category", () => {
            expect(tool.category).toBe("search")
        })

        it("should not require confirmation", () => {
            expect(tool.requiresConfirmation).toBe(false)
        })

        it("should have correct parameters", () => {
            expect(tool.parameters).toHaveLength(1)
            expect(tool.parameters[0].name).toBe("symbol")
            expect(tool.parameters[0].required).toBe(true)
        })

        it("should have description", () => {
            expect(tool.description).toContain("Find where a symbol is defined")
        })
    })

    describe("validateParams", () => {
        it("should return null for valid params", () => {
            expect(tool.validateParams({ symbol: "myFunction" })).toBeNull()
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
    })

    describe("execute", () => {
        it("should find function definition", async () => {
            const files = new Map<string, FileData>([
                [
                    "src/utils.ts",
                    createMockFileData([
                        "// Utility functions",
                        "export function myFunction() {",
                        "    return 42",
                        "}",
                    ]),
                ],
            ])
            const symbolIndex: SymbolIndex = new Map([
                ["myFunction", [{ path: "src/utils.ts", line: 2, type: "function" as const }]],
            ])
            const storage = createMockStorage(files, symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "myFunction" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.symbol).toBe("myFunction")
            expect(data.found).toBe(true)
            expect(data.definitions).toHaveLength(1)
            expect(data.definitions[0].path).toBe("src/utils.ts")
            expect(data.definitions[0].line).toBe(2)
            expect(data.definitions[0].type).toBe("function")
        })

        it("should find class definition", async () => {
            const files = new Map<string, FileData>([
                [
                    "src/models.ts",
                    createMockFileData([
                        "export class User {",
                        "    constructor(public name: string) {}",
                        "}",
                    ]),
                ],
            ])
            const symbolIndex: SymbolIndex = new Map([
                ["User", [{ path: "src/models.ts", line: 1, type: "class" as const }]],
            ])
            const storage = createMockStorage(files, symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "User" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(true)
            expect(data.definitions[0].type).toBe("class")
        })

        it("should find interface definition", async () => {
            const files = new Map<string, FileData>([
                [
                    "src/types.ts",
                    createMockFileData(["export interface Config {", "    port: number", "}"]),
                ],
            ])
            const symbolIndex: SymbolIndex = new Map([
                ["Config", [{ path: "src/types.ts", line: 1, type: "interface" as const }]],
            ])
            const storage = createMockStorage(files, symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "Config" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(true)
            expect(data.definitions[0].type).toBe("interface")
        })

        it("should find type alias definition", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["ID", [{ path: "src/types.ts", line: 1, type: "type" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "ID" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(true)
            expect(data.definitions[0].type).toBe("type")
        })

        it("should find variable definition", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["DEFAULT_CONFIG", [{ path: "src/config.ts", line: 5, type: "variable" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "DEFAULT_CONFIG" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(true)
            expect(data.definitions[0].type).toBe("variable")
        })

        it("should find multiple definitions (function overloads)", async () => {
            const symbolIndex: SymbolIndex = new Map([
                [
                    "process",
                    [
                        { path: "src/a.ts", line: 1, type: "function" as const },
                        { path: "src/b.ts", line: 5, type: "function" as const },
                    ],
                ],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "process" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(true)
            expect(data.definitions).toHaveLength(2)
        })

        it("should return not found for unknown symbol", async () => {
            const symbolIndex: SymbolIndex = new Map()
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "unknownSymbol" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(false)
            expect(data.definitions).toHaveLength(0)
        })

        it("should suggest similar symbols when not found", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["myFunction", [{ path: "src/a.ts", line: 1, type: "function" as const }]],
                ["myFunctionAsync", [{ path: "src/a.ts", line: 5, type: "function" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "myFunc" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(false)
            expect(data.suggestions).toBeDefined()
            expect(data.suggestions).toContain("myFunction")
        })

        it("should not include suggestions when exact match found", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["myFunction", [{ path: "src/a.ts", line: 1, type: "function" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "myFunction" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(true)
            expect(data.suggestions).toBeUndefined()
        })

        it("should include context lines", async () => {
            const files = new Map<string, FileData>([
                [
                    "src/test.ts",
                    createMockFileData([
                        "// Line 1",
                        "// Line 2",
                        "export function myFunc() {",
                        "    return 1",
                        "}",
                    ]),
                ],
            ])
            const symbolIndex: SymbolIndex = new Map([
                ["myFunc", [{ path: "src/test.ts", line: 3, type: "function" as const }]],
            ])
            const storage = createMockStorage(files, symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "myFunc" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            const context = data.definitions[0].context
            expect(context).toContain("// Line 1")
            expect(context).toContain("// Line 2")
            expect(context).toContain("export function myFunc()")
            expect(context).toContain("return 1")
            expect(context).toContain("}")
        })

        it("should mark definition line in context", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["// before", "const foo = 1", "// after"])],
            ])
            const symbolIndex: SymbolIndex = new Map([
                ["foo", [{ path: "src/test.ts", line: 2, type: "variable" as const }]],
            ])
            const storage = createMockStorage(files, symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            const context = data.definitions[0].context
            expect(context).toContain(">   2│const foo = 1")
            expect(context).toContain("    1│// before")
        })

        it("should handle context at file start", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["const x = 1", "// after"])],
            ])
            const symbolIndex: SymbolIndex = new Map([
                ["x", [{ path: "src/test.ts", line: 1, type: "variable" as const }]],
            ])
            const storage = createMockStorage(files, symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            const context = data.definitions[0].context
            expect(context).toContain(">   1│const x = 1")
        })

        it("should handle context at file end", async () => {
            const files = new Map<string, FileData>([
                ["src/test.ts", createMockFileData(["// before", "const x = 1"])],
            ])
            const symbolIndex: SymbolIndex = new Map([
                ["x", [{ path: "src/test.ts", line: 2, type: "variable" as const }]],
            ])
            const storage = createMockStorage(files, symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            const context = data.definitions[0].context
            expect(context).toContain(">   2│const x = 1")
        })

        it("should handle empty context when file not found", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["foo", [{ path: "src/nonexistent.ts", line: 1, type: "function" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(true)
            expect(data.definitions[0].context).toBe("")
        })

        it("should sort definitions by path then line", async () => {
            const symbolIndex: SymbolIndex = new Map([
                [
                    "foo",
                    [
                        { path: "src/b.ts", line: 10, type: "function" as const },
                        { path: "src/a.ts", line: 5, type: "function" as const },
                        { path: "src/b.ts", line: 1, type: "function" as const },
                    ],
                ],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "foo" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.definitions[0].path).toBe("src/a.ts")
            expect(data.definitions[1].path).toBe("src/b.ts")
            expect(data.definitions[1].line).toBe(1)
            expect(data.definitions[2].path).toBe("src/b.ts")
            expect(data.definitions[2].line).toBe(10)
        })

        it("should include callId in result", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["x", [{ path: "src/a.ts", line: 1, type: "variable" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "x" }, ctx)

            expect(result.callId).toMatch(/^find_definition-\d+$/)
        })

        it("should include execution time in result", async () => {
            const symbolIndex: SymbolIndex = new Map()
            const storage = createMockStorage(new Map(), symbolIndex)
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
            const symbolIndex: SymbolIndex = new Map([
                ["foo", [{ path: "src/a.ts", line: 1, type: "function" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "  foo  " }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.symbol).toBe("foo")
            expect(data.found).toBe(true)
        })

        it("should suggest symbols with small edit distance", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["fetchData", [{ path: "src/a.ts", line: 1, type: "function" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "fethcData" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(false)
            expect(data.suggestions).toContain("fetchData")
        })

        it("should limit suggestions to 5", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["testA", [{ path: "a.ts", line: 1, type: "function" as const }]],
                ["testB", [{ path: "b.ts", line: 1, type: "function" as const }]],
                ["testC", [{ path: "c.ts", line: 1, type: "function" as const }]],
                ["testD", [{ path: "d.ts", line: 1, type: "function" as const }]],
                ["testE", [{ path: "e.ts", line: 1, type: "function" as const }]],
                ["testF", [{ path: "f.ts", line: 1, type: "function" as const }]],
                ["testG", [{ path: "g.ts", line: 1, type: "function" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "test" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.suggestions).toBeDefined()
            expect(data.suggestions!.length).toBeLessThanOrEqual(5)
        })

        it("should sort suggestions alphabetically", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["testC", [{ path: "c.ts", line: 1, type: "function" as const }]],
                ["testA", [{ path: "a.ts", line: 1, type: "function" as const }]],
                ["testB", [{ path: "b.ts", line: 1, type: "function" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "test" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.suggestions).toEqual(["testA", "testB", "testC"])
        })

        it("should not include suggestions when no similar symbols exist", async () => {
            const symbolIndex: SymbolIndex = new Map([
                ["xyz", [{ path: "a.ts", line: 1, type: "function" as const }]],
            ])
            const storage = createMockStorage(new Map(), symbolIndex)
            const ctx = createMockContext(storage)

            const result = await tool.execute({ symbol: "abc" }, ctx)

            expect(result.success).toBe(true)
            const data = result.data as FindDefinitionResult
            expect(data.found).toBe(false)
            expect(data.suggestions).toBeUndefined()
        })
    })
})
