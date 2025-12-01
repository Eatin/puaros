import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    GitDiffTool,
    type GitDiffResult,
} from "../../../../../src/infrastructure/tools/git/GitDiffTool.js"
import type { ToolContext } from "../../../../../src/domain/services/ITool.js"
import type { IStorage } from "../../../../../src/domain/services/IStorage.js"
import type { SimpleGit, DiffResult } from "simple-git"

function createMockStorage(): IStorage {
    return {
        getFile: vi.fn(),
        setFile: vi.fn(),
        deleteFile: vi.fn(),
        getAllFiles: vi.fn().mockResolvedValue(new Map()),
        getFileCount: vi.fn().mockResolvedValue(0),
        getAST: vi.fn(),
        setAST: vi.fn(),
        deleteAST: vi.fn(),
        getAllASTs: vi.fn().mockResolvedValue(new Map()),
        getMeta: vi.fn(),
        setMeta: vi.fn(),
        deleteMeta: vi.fn(),
        getAllMetas: vi.fn().mockResolvedValue(new Map()),
        getSymbolIndex: vi.fn().mockResolvedValue(new Map()),
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

function createMockDiffSummary(overrides: Partial<DiffResult> = {}): DiffResult {
    return {
        changed: 0,
        deletions: 0,
        insertions: 0,
        files: [],
        ...overrides,
    } as DiffResult
}

function createMockGit(options: {
    isRepo?: boolean
    diffSummary?: DiffResult
    diff?: string
    error?: Error
}): SimpleGit {
    const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(options.isRepo ?? true),
        diffSummary: vi.fn(),
        diff: vi.fn(),
    }

    if (options.error) {
        mockGit.diffSummary.mockRejectedValue(options.error)
    } else {
        mockGit.diffSummary.mockResolvedValue(options.diffSummary ?? createMockDiffSummary())
        mockGit.diff.mockResolvedValue(options.diff ?? "")
    }

    return mockGit as unknown as SimpleGit
}

describe("GitDiffTool", () => {
    let tool: GitDiffTool

    beforeEach(() => {
        tool = new GitDiffTool()
    })

    describe("metadata", () => {
        it("should have correct name", () => {
            expect(tool.name).toBe("git_diff")
        })

        it("should have correct category", () => {
            expect(tool.category).toBe("git")
        })

        it("should not require confirmation", () => {
            expect(tool.requiresConfirmation).toBe(false)
        })

        it("should have correct parameters", () => {
            expect(tool.parameters).toHaveLength(2)
            expect(tool.parameters[0].name).toBe("path")
            expect(tool.parameters[0].required).toBe(false)
            expect(tool.parameters[1].name).toBe("staged")
            expect(tool.parameters[1].required).toBe(false)
        })

        it("should have description", () => {
            expect(tool.description).toContain("diff")
            expect(tool.description).toContain("changes")
        })
    })

    describe("validateParams", () => {
        it("should return null for empty params", () => {
            expect(tool.validateParams({})).toBeNull()
        })

        it("should return null for valid path", () => {
            expect(tool.validateParams({ path: "src" })).toBeNull()
        })

        it("should return null for valid staged", () => {
            expect(tool.validateParams({ staged: true })).toBeNull()
            expect(tool.validateParams({ staged: false })).toBeNull()
        })

        it("should return error for invalid path type", () => {
            expect(tool.validateParams({ path: 123 })).toContain("path")
            expect(tool.validateParams({ path: 123 })).toContain("string")
        })

        it("should return error for invalid staged type", () => {
            expect(tool.validateParams({ staged: "yes" })).toContain("staged")
            expect(tool.validateParams({ staged: "yes" })).toContain("boolean")
        })
    })

    describe("execute", () => {
        describe("not a git repository", () => {
            it("should return error when not in a git repo", async () => {
                const mockGit = createMockGit({ isRepo: false })
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(false)
                expect(result.error).toContain("Not a git repository")
            })
        })

        describe("no changes", () => {
            it("should return empty diff for clean repo", async () => {
                const mockGit = createMockGit({
                    diffSummary: createMockDiffSummary({ files: [] }),
                    diff: "",
                })
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitDiffResult
                expect(data.hasChanges).toBe(false)
                expect(data.files).toHaveLength(0)
                expect(data.diff).toBe("")
            })
        })

        describe("with changes", () => {
            it("should return diff for modified files", async () => {
                const mockGit = createMockGit({
                    diffSummary: createMockDiffSummary({
                        files: [
                            { file: "src/index.ts", insertions: 5, deletions: 2, binary: false },
                        ],
                        insertions: 5,
                        deletions: 2,
                    }),
                    diff: "diff --git a/src/index.ts",
                })
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitDiffResult
                expect(data.hasChanges).toBe(true)
                expect(data.files).toHaveLength(1)
                expect(data.files[0].file).toBe("src/index.ts")
                expect(data.files[0].insertions).toBe(5)
                expect(data.files[0].deletions).toBe(2)
            })

            it("should return multiple files", async () => {
                const mockGit = createMockGit({
                    diffSummary: createMockDiffSummary({
                        files: [
                            { file: "a.ts", insertions: 1, deletions: 0, binary: false },
                            { file: "b.ts", insertions: 2, deletions: 1, binary: false },
                            { file: "c.ts", insertions: 0, deletions: 5, binary: false },
                        ],
                        insertions: 3,
                        deletions: 6,
                    }),
                })
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitDiffResult
                expect(data.files).toHaveLength(3)
                expect(data.summary.filesChanged).toBe(3)
                expect(data.summary.insertions).toBe(3)
                expect(data.summary.deletions).toBe(6)
            })

            it("should handle binary files", async () => {
                const mockGit = createMockGit({
                    diffSummary: createMockDiffSummary({
                        files: [{ file: "image.png", insertions: 0, deletions: 0, binary: true }],
                    }),
                })
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitDiffResult
                expect(data.files[0].binary).toBe(true)
            })
        })

        describe("staged parameter", () => {
            it("should default to false (unstaged)", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitDiffResult
                expect(data.staged).toBe(false)
                expect(mockGit.diffSummary).toHaveBeenCalledWith([])
            })

            it("should pass --cached for staged=true", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({ staged: true }, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitDiffResult
                expect(data.staged).toBe(true)
                expect(mockGit.diffSummary).toHaveBeenCalledWith(["--cached"])
            })
        })

        describe("path parameter", () => {
            it("should filter by path", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({ path: "src" }, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitDiffResult
                expect(data.pathFilter).toBe("src")
                expect(mockGit.diffSummary).toHaveBeenCalledWith(["--", "src"])
            })

            it("should combine staged and path", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { staged: true, path: "src/index.ts" },
                    ctx,
                )

                expect(result.success).toBe(true)
                expect(mockGit.diffSummary).toHaveBeenCalledWith(["--cached", "--", "src/index.ts"])
            })

            it("should return null pathFilter when not provided", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitDiffResult
                expect(data.pathFilter).toBeNull()
            })
        })

        describe("diff text", () => {
            it("should include full diff text", async () => {
                const diffText = `diff --git a/src/index.ts b/src/index.ts
index abc123..def456 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
+import { foo } from "./foo"
 export function main() {
     console.log("hello")
 }`
                const mockGit = createMockGit({
                    diffSummary: createMockDiffSummary({
                        files: [
                            { file: "src/index.ts", insertions: 1, deletions: 0, binary: false },
                        ],
                    }),
                    diff: diffText,
                })
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitDiffResult
                expect(data.diff).toBe(diffText)
                expect(data.diff).toContain("diff --git")
                expect(data.diff).toContain("import { foo }")
            })
        })

        describe("error handling", () => {
            it("should handle git command errors", async () => {
                const mockGit = createMockGit({
                    error: new Error("Git command failed"),
                })
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(false)
                expect(result.error).toContain("Git command failed")
            })

            it("should handle non-Error exceptions", async () => {
                const mockGit = {
                    checkIsRepo: vi.fn().mockResolvedValue(true),
                    diffSummary: vi.fn().mockRejectedValue("string error"),
                } as unknown as SimpleGit
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(false)
                expect(result.error).toBe("string error")
            })
        })

        describe("timing", () => {
            it("should return timing information", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
            })
        })

        describe("call id", () => {
            it("should generate unique call id", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitDiffTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.callId).toMatch(/^git_diff-\d+$/)
            })
        })
    })
})
