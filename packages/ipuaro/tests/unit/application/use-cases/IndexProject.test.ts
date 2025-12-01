import { describe, it, expect, vi, beforeEach } from "vitest"
import { IndexProject } from "../../../../src/application/use-cases/IndexProject.js"
import type { IStorage, SymbolIndex, DepsGraph } from "../../../../src/domain/services/IStorage.js"
import type { IndexProgress } from "../../../../src/domain/services/IIndexer.js"
import { createFileData } from "../../../../src/domain/value-objects/FileData.js"
import { createEmptyFileAST } from "../../../../src/domain/value-objects/FileAST.js"
import { createFileMeta } from "../../../../src/domain/value-objects/FileMeta.js"

vi.mock("../../../../src/infrastructure/indexer/FileScanner.js", () => ({
    FileScanner: class {
        async scanAll() {
            return [
                { path: "src/index.ts", type: "file", size: 100, lastModified: Date.now() },
                { path: "src/utils.ts", type: "file", size: 200, lastModified: Date.now() },
            ]
        }
        static async readFileContent(path: string) {
            if (path.includes("index.ts")) {
                return 'export function main() { return "hello" }'
            }
            if (path.includes("utils.ts")) {
                return "export const add = (a: number, b: number) => a + b"
            }
            return null
        }
    },
}))

vi.mock("../../../../src/infrastructure/indexer/ASTParser.js", () => ({
    ASTParser: class {
        parse() {
            return {
                ...createEmptyFileAST(),
                functions: [
                    {
                        name: "test",
                        lineStart: 1,
                        lineEnd: 5,
                        params: [],
                        isAsync: false,
                        isExported: true,
                    },
                ],
            }
        }
    },
}))

vi.mock("../../../../src/infrastructure/indexer/MetaAnalyzer.js", () => ({
    MetaAnalyzer: class {
        constructor() {}
        analyze() {
            return createFileMeta()
        }
    },
}))

vi.mock("../../../../src/infrastructure/indexer/IndexBuilder.js", () => ({
    IndexBuilder: class {
        constructor() {}
        buildSymbolIndex() {
            return new Map([
                ["test", [{ path: "src/index.ts", line: 1, type: "function" }]],
            ]) as SymbolIndex
        }
        buildDepsGraph() {
            return {
                imports: new Map(),
                importedBy: new Map(),
            } as DepsGraph
        }
    },
}))

describe("IndexProject", () => {
    let useCase: IndexProject
    let mockStorage: IStorage

    beforeEach(() => {
        mockStorage = {
            getFile: vi.fn().mockResolvedValue(null),
            setFile: vi.fn().mockResolvedValue(undefined),
            deleteFile: vi.fn().mockResolvedValue(undefined),
            getAllFiles: vi.fn().mockResolvedValue(new Map()),
            getFileCount: vi.fn().mockResolvedValue(0),
            getAST: vi.fn().mockResolvedValue(null),
            setAST: vi.fn().mockResolvedValue(undefined),
            deleteAST: vi.fn().mockResolvedValue(undefined),
            getAllASTs: vi.fn().mockResolvedValue(new Map()),
            getMeta: vi.fn().mockResolvedValue(null),
            setMeta: vi.fn().mockResolvedValue(undefined),
            deleteMeta: vi.fn().mockResolvedValue(undefined),
            getAllMetas: vi.fn().mockResolvedValue(new Map()),
            getSymbolIndex: vi.fn().mockResolvedValue(new Map()),
            setSymbolIndex: vi.fn().mockResolvedValue(undefined),
            getDepsGraph: vi.fn().mockResolvedValue({ imports: new Map(), importedBy: new Map() }),
            setDepsGraph: vi.fn().mockResolvedValue(undefined),
            getProjectConfig: vi.fn().mockResolvedValue(null),
            setProjectConfig: vi.fn().mockResolvedValue(undefined),
            connect: vi.fn().mockResolvedValue(undefined),
            disconnect: vi.fn().mockResolvedValue(undefined),
            isConnected: vi.fn().mockReturnValue(true),
            clear: vi.fn().mockResolvedValue(undefined),
        }

        useCase = new IndexProject(mockStorage, "/test/project")
    })

    describe("execute", () => {
        it("should index project and return stats", async () => {
            const stats = await useCase.execute("/test/project")

            expect(stats.filesScanned).toBe(2)
            expect(stats.filesParsed).toBe(2)
            expect(stats.parseErrors).toBe(0)
            expect(stats.timeMs).toBeGreaterThanOrEqual(0)
        })

        it("should store file data for all scanned files", async () => {
            await useCase.execute("/test/project")

            expect(mockStorage.setFile).toHaveBeenCalledTimes(2)
            expect(mockStorage.setFile).toHaveBeenCalledWith(
                "src/index.ts",
                expect.objectContaining({
                    hash: expect.any(String),
                    lines: expect.any(Array),
                }),
            )
        })

        it("should store AST for all parsed files", async () => {
            await useCase.execute("/test/project")

            expect(mockStorage.setAST).toHaveBeenCalledTimes(2)
            expect(mockStorage.setAST).toHaveBeenCalledWith(
                "src/index.ts",
                expect.objectContaining({
                    functions: expect.any(Array),
                }),
            )
        })

        it("should store metadata for all files", async () => {
            await useCase.execute("/test/project")

            expect(mockStorage.setMeta).toHaveBeenCalledTimes(2)
            expect(mockStorage.setMeta).toHaveBeenCalledWith("src/index.ts", expect.any(Object))
        })

        it("should build and store symbol index", async () => {
            await useCase.execute("/test/project")

            expect(mockStorage.setSymbolIndex).toHaveBeenCalledTimes(1)
            expect(mockStorage.setSymbolIndex).toHaveBeenCalledWith(expect.any(Map))
        })

        it("should build and store dependency graph", async () => {
            await useCase.execute("/test/project")

            expect(mockStorage.setDepsGraph).toHaveBeenCalledTimes(1)
            expect(mockStorage.setDepsGraph).toHaveBeenCalledWith(
                expect.objectContaining({
                    imports: expect.any(Map),
                    importedBy: expect.any(Map),
                }),
            )
        })

        it("should store last indexed timestamp", async () => {
            await useCase.execute("/test/project")

            expect(mockStorage.setProjectConfig).toHaveBeenCalledWith(
                "last_indexed",
                expect.any(Number),
            )
        })

        it("should call progress callback during indexing", async () => {
            const progressCallback = vi.fn()

            await useCase.execute("/test/project", {
                onProgress: progressCallback,
            })

            expect(progressCallback).toHaveBeenCalled()
            expect(progressCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    current: expect.any(Number),
                    total: expect.any(Number),
                    currentFile: expect.any(String),
                    phase: expect.stringMatching(/scanning|parsing|analyzing|indexing/),
                }),
            )
        })

        it("should report scanning phase", async () => {
            const progressCallback = vi.fn()

            await useCase.execute("/test/project", {
                onProgress: progressCallback,
            })

            const scanningCalls = progressCallback.mock.calls.filter(
                (call) => call[0].phase === "scanning",
            )
            expect(scanningCalls.length).toBeGreaterThan(0)
        })

        it("should report parsing phase", async () => {
            const progressCallback = vi.fn()

            await useCase.execute("/test/project", {
                onProgress: progressCallback,
            })

            const parsingCalls = progressCallback.mock.calls.filter(
                (call) => call[0].phase === "parsing",
            )
            expect(parsingCalls.length).toBeGreaterThan(0)
        })

        it("should report analyzing phase", async () => {
            const progressCallback = vi.fn()

            await useCase.execute("/test/project", {
                onProgress: progressCallback,
            })

            const analyzingCalls = progressCallback.mock.calls.filter(
                (call) => call[0].phase === "analyzing",
            )
            expect(analyzingCalls.length).toBeGreaterThan(0)
        })

        it("should report indexing phase", async () => {
            const progressCallback = vi.fn()

            await useCase.execute("/test/project", {
                onProgress: progressCallback,
            })

            const indexingCalls = progressCallback.mock.calls.filter(
                (call) => call[0].phase === "indexing",
            )
            expect(indexingCalls.length).toBeGreaterThan(0)
        })

        it("should detect TypeScript files", async () => {
            await useCase.execute("/test/project")

            expect(mockStorage.setAST).toHaveBeenCalledWith("src/index.ts", expect.any(Object))
        })

        it("should handle files without parseable language", async () => {
            vi.mocked(mockStorage.setFile).mockClear()

            await useCase.execute("/test/project")

            const stats = await useCase.execute("/test/project")
            expect(stats.filesScanned).toBeGreaterThanOrEqual(0)
        })

        it("should calculate indexing duration", async () => {
            const startTime = Date.now()
            const stats = await useCase.execute("/test/project")
            const endTime = Date.now()

            expect(stats.timeMs).toBeGreaterThanOrEqual(0)
            expect(stats.timeMs).toBeLessThanOrEqual(endTime - startTime + 10)
        })
    })

    describe("language detection", () => {
        it("should detect .ts files", async () => {
            await useCase.execute("/test/project")

            expect(mockStorage.setAST).toHaveBeenCalledWith(
                expect.stringContaining(".ts"),
                expect.any(Object),
            )
        })
    })

    describe("progress reporting", () => {
        it("should not fail if progress callback is not provided", async () => {
            await expect(useCase.execute("/test/project")).resolves.toBeDefined()
        })

        it("should include current file in progress updates", async () => {
            const progressCallback = vi.fn()

            await useCase.execute("/test/project", {
                onProgress: progressCallback,
            })

            const callsWithFiles = progressCallback.mock.calls.filter(
                (call) => call[0].currentFile && call[0].currentFile.length > 0,
            )
            expect(callsWithFiles.length).toBeGreaterThan(0)
        })

        it("should report correct total count", async () => {
            const progressCallback = vi.fn()

            await useCase.execute("/test/project", {
                onProgress: progressCallback,
            })

            const parsingCalls = progressCallback.mock.calls.filter(
                (call) => call[0].phase === "parsing",
            )
            if (parsingCalls.length > 0) {
                expect(parsingCalls[0][0].total).toBe(2)
            }
        })
    })
})
