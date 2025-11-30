import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    GitStatusTool,
    type GitStatusResult,
} from "../../../../../src/infrastructure/tools/git/GitStatusTool.js"
import type { ToolContext } from "../../../../../src/domain/services/ITool.js"
import type { IStorage } from "../../../../../src/domain/services/IStorage.js"
import type { SimpleGit, StatusResult } from "simple-git"

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

function createMockStatusResult(overrides: Partial<StatusResult> = {}): StatusResult {
    return {
        not_added: [],
        conflicted: [],
        created: [],
        deleted: [],
        ignored: [],
        modified: [],
        renamed: [],
        files: [],
        staged: [],
        ahead: 0,
        behind: 0,
        current: "main",
        tracking: "origin/main",
        detached: false,
        isClean: () => true,
        ...overrides,
    } as StatusResult
}

function createMockGit(options: {
    isRepo?: boolean
    status?: StatusResult
    error?: Error
}): SimpleGit {
    const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(options.isRepo ?? true),
        status: vi.fn(),
    }

    if (options.error) {
        mockGit.status.mockRejectedValue(options.error)
    } else {
        mockGit.status.mockResolvedValue(options.status ?? createMockStatusResult())
    }

    return mockGit as unknown as SimpleGit
}

describe("GitStatusTool", () => {
    let tool: GitStatusTool

    beforeEach(() => {
        tool = new GitStatusTool()
    })

    describe("metadata", () => {
        it("should have correct name", () => {
            expect(tool.name).toBe("git_status")
        })

        it("should have correct category", () => {
            expect(tool.category).toBe("git")
        })

        it("should not require confirmation", () => {
            expect(tool.requiresConfirmation).toBe(false)
        })

        it("should have no parameters", () => {
            expect(tool.parameters).toHaveLength(0)
        })

        it("should have description", () => {
            expect(tool.description).toContain("git")
            expect(tool.description).toContain("status")
        })
    })

    describe("validateParams", () => {
        it("should return null for empty params", () => {
            expect(tool.validateParams({})).toBeNull()
        })

        it("should return null for any params (no required)", () => {
            expect(tool.validateParams({ foo: "bar" })).toBeNull()
        })
    })

    describe("execute", () => {
        describe("not a git repository", () => {
            it("should return error when not in a git repo", async () => {
                const mockGit = createMockGit({ isRepo: false })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(false)
                expect(result.error).toContain("Not a git repository")
            })
        })

        describe("clean repository", () => {
            it("should return clean status", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        current: "main",
                        tracking: "origin/main",
                        ahead: 0,
                        behind: 0,
                        isClean: () => true,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.branch).toBe("main")
                expect(data.tracking).toBe("origin/main")
                expect(data.isClean).toBe(true)
                expect(data.staged).toHaveLength(0)
                expect(data.modified).toHaveLength(0)
                expect(data.untracked).toHaveLength(0)
            })
        })

        describe("branch information", () => {
            it("should return current branch name", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({ current: "feature/test" }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.branch).toBe("feature/test")
            })

            it("should handle detached HEAD", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({ current: null }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.branch).toBe("HEAD (detached)")
            })

            it("should return tracking branch when available", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({ tracking: "origin/develop" }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.tracking).toBe("origin/develop")
            })

            it("should handle no tracking branch", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({ tracking: null }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.tracking).toBeNull()
            })

            it("should return ahead/behind counts", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({ ahead: 3, behind: 1 }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.ahead).toBe(3)
                expect(data.behind).toBe(1)
            })
        })

        describe("staged files", () => {
            it("should return staged files (new file)", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        files: [{ path: "new.ts", index: "A", working_dir: " " }],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.staged).toHaveLength(1)
                expect(data.staged[0].path).toBe("new.ts")
                expect(data.staged[0].index).toBe("A")
            })

            it("should return staged files (modified)", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        files: [{ path: "src/index.ts", index: "M", working_dir: " " }],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.staged).toHaveLength(1)
                expect(data.staged[0].path).toBe("src/index.ts")
                expect(data.staged[0].index).toBe("M")
            })

            it("should return staged files (deleted)", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        files: [{ path: "old.ts", index: "D", working_dir: " " }],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.staged).toHaveLength(1)
                expect(data.staged[0].index).toBe("D")
            })

            it("should return multiple staged files", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        files: [
                            { path: "a.ts", index: "A", working_dir: " " },
                            { path: "b.ts", index: "M", working_dir: " " },
                            { path: "c.ts", index: "D", working_dir: " " },
                        ],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.staged).toHaveLength(3)
            })
        })

        describe("modified files", () => {
            it("should return modified unstaged files", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        files: [{ path: "src/app.ts", index: " ", working_dir: "M" }],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.modified).toHaveLength(1)
                expect(data.modified[0].path).toBe("src/app.ts")
                expect(data.modified[0].workingDir).toBe("M")
            })

            it("should return deleted unstaged files", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        files: [{ path: "deleted.ts", index: " ", working_dir: "D" }],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.modified).toHaveLength(1)
                expect(data.modified[0].workingDir).toBe("D")
            })
        })

        describe("untracked files", () => {
            it("should return untracked files", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        not_added: ["new-file.ts", "another.js"],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.untracked).toContain("new-file.ts")
                expect(data.untracked).toContain("another.js")
            })
        })

        describe("conflicted files", () => {
            it("should return conflicted files", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        conflicted: ["conflict.ts"],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.conflicted).toContain("conflict.ts")
            })
        })

        describe("mixed status", () => {
            it("should correctly categorize files with both staged and unstaged changes", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        files: [{ path: "both.ts", index: "M", working_dir: "M" }],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.staged).toHaveLength(1)
                expect(data.modified).toHaveLength(1)
                expect(data.staged[0].path).toBe("both.ts")
                expect(data.modified[0].path).toBe("both.ts")
            })

            it("should not include untracked in staged/modified", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({
                        files: [{ path: "new.ts", index: "?", working_dir: "?" }],
                        not_added: ["new.ts"],
                        isClean: () => false,
                    }),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as GitStatusResult
                expect(data.staged).toHaveLength(0)
                expect(data.modified).toHaveLength(0)
                expect(data.untracked).toContain("new.ts")
            })
        })

        describe("error handling", () => {
            it("should handle git command errors", async () => {
                const mockGit = createMockGit({
                    error: new Error("Git command failed"),
                })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(false)
                expect(result.error).toContain("Git command failed")
            })

            it("should handle non-Error exceptions", async () => {
                const mockGit = {
                    checkIsRepo: vi.fn().mockResolvedValue(true),
                    status: vi.fn().mockRejectedValue("string error"),
                } as unknown as SimpleGit
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.success).toBe(false)
                expect(result.error).toBe("string error")
            })
        })

        describe("timing", () => {
            it("should return timing information", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
            })

            it("should include timing on error", async () => {
                const mockGit = createMockGit({ error: new Error("fail") })
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
            })
        })

        describe("call id", () => {
            it("should generate unique call id", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitStatusTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute({}, ctx)

                expect(result.callId).toMatch(/^git_status-\d+$/)
            })
        })
    })
})
