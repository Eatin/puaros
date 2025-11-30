import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    GitCommitTool,
    type GitCommitResult,
} from "../../../../../src/infrastructure/tools/git/GitCommitTool.js"
import type { ToolContext } from "../../../../../src/domain/services/ITool.js"
import type { IStorage } from "../../../../../src/domain/services/IStorage.js"
import type { SimpleGit, CommitResult, StatusResult } from "simple-git"

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

function createMockContext(
    storage?: IStorage,
    confirmResult: boolean = true,
): ToolContext {
    return {
        projectRoot: "/test/project",
        storage: storage ?? createMockStorage(),
        requestConfirmation: vi.fn().mockResolvedValue(confirmResult),
        onProgress: vi.fn(),
    }
}

function createMockStatusResult(
    overrides: Partial<StatusResult> = {},
): StatusResult {
    return {
        not_added: [],
        conflicted: [],
        created: [],
        deleted: [],
        ignored: [],
        modified: [],
        renamed: [],
        files: [],
        staged: ["file.ts"],
        ahead: 0,
        behind: 0,
        current: "main",
        tracking: "origin/main",
        detached: false,
        isClean: () => false,
        ...overrides,
    } as StatusResult
}

function createMockCommitResult(
    overrides: Partial<CommitResult> = {},
): CommitResult {
    return {
        commit: "abc1234",
        branch: "main",
        root: false,
        author: null,
        summary: {
            changes: 1,
            insertions: 5,
            deletions: 2,
        },
        ...overrides,
    } as CommitResult
}

function createMockGit(options: {
    isRepo?: boolean
    status?: StatusResult
    commitResult?: CommitResult
    error?: Error
    addError?: Error
}): SimpleGit {
    const mockGit = {
        checkIsRepo: vi.fn().mockResolvedValue(options.isRepo ?? true),
        status: vi.fn().mockResolvedValue(
            options.status ?? createMockStatusResult(),
        ),
        add: vi.fn(),
        commit: vi.fn(),
    }

    if (options.addError) {
        mockGit.add.mockRejectedValue(options.addError)
    } else {
        mockGit.add.mockResolvedValue(undefined)
    }

    if (options.error) {
        mockGit.commit.mockRejectedValue(options.error)
    } else {
        mockGit.commit.mockResolvedValue(
            options.commitResult ?? createMockCommitResult(),
        )
    }

    return mockGit as unknown as SimpleGit
}

describe("GitCommitTool", () => {
    let tool: GitCommitTool

    beforeEach(() => {
        tool = new GitCommitTool()
    })

    describe("metadata", () => {
        it("should have correct name", () => {
            expect(tool.name).toBe("git_commit")
        })

        it("should have correct category", () => {
            expect(tool.category).toBe("git")
        })

        it("should require confirmation", () => {
            expect(tool.requiresConfirmation).toBe(true)
        })

        it("should have correct parameters", () => {
            expect(tool.parameters).toHaveLength(2)
            expect(tool.parameters[0].name).toBe("message")
            expect(tool.parameters[0].required).toBe(true)
            expect(tool.parameters[1].name).toBe("files")
            expect(tool.parameters[1].required).toBe(false)
        })

        it("should have description", () => {
            expect(tool.description).toContain("commit")
            expect(tool.description).toContain("confirmation")
        })
    })

    describe("validateParams", () => {
        it("should return error for missing message", () => {
            expect(tool.validateParams({})).toContain("message")
            expect(tool.validateParams({})).toContain("required")
        })

        it("should return error for non-string message", () => {
            expect(tool.validateParams({ message: 123 })).toContain("message")
            expect(tool.validateParams({ message: 123 })).toContain("string")
        })

        it("should return error for empty message", () => {
            expect(tool.validateParams({ message: "" })).toContain("empty")
            expect(tool.validateParams({ message: "   " })).toContain("empty")
        })

        it("should return null for valid message", () => {
            expect(tool.validateParams({ message: "fix: bug" })).toBeNull()
        })

        it("should return null for valid message with files", () => {
            expect(
                tool.validateParams({ message: "fix: bug", files: ["a.ts", "b.ts"] }),
            ).toBeNull()
        })

        it("should return error for non-array files", () => {
            expect(
                tool.validateParams({ message: "fix: bug", files: "a.ts" }),
            ).toContain("array")
        })

        it("should return error for non-string in files array", () => {
            expect(
                tool.validateParams({ message: "fix: bug", files: [1, 2] }),
            ).toContain("strings")
        })
    })

    describe("execute", () => {
        describe("not a git repository", () => {
            it("should return error when not in a git repo", async () => {
                const mockGit = createMockGit({ isRepo: false })
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { message: "test commit" },
                    ctx,
                )

                expect(result.success).toBe(false)
                expect(result.error).toContain("Not a git repository")
            })
        })

        describe("nothing to commit", () => {
            it("should return error when no staged files", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({ staged: [] }),
                })
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { message: "test commit" },
                    ctx,
                )

                expect(result.success).toBe(false)
                expect(result.error).toContain("Nothing to commit")
            })
        })

        describe("with staged files", () => {
            it("should commit successfully", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({ staged: ["file.ts"] }),
                    commitResult: createMockCommitResult({
                        commit: "def5678",
                        branch: "main",
                        summary: { changes: 1, insertions: 10, deletions: 3 },
                    }),
                })
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { message: "feat: new feature" },
                    ctx,
                )

                expect(result.success).toBe(true)
                const data = result.data as GitCommitResult
                expect(data.hash).toBe("def5678")
                expect(data.branch).toBe("main")
                expect(data.message).toBe("feat: new feature")
                expect(data.filesChanged).toBe(1)
                expect(data.insertions).toBe(10)
                expect(data.deletions).toBe(3)
            })

            it("should include author when available", async () => {
                const mockGit = createMockGit({
                    commitResult: createMockCommitResult({
                        author: {
                            name: "Test User",
                            email: "test@example.com",
                        },
                    }),
                })
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { message: "test commit" },
                    ctx,
                )

                expect(result.success).toBe(true)
                const data = result.data as GitCommitResult
                expect(data.author).toEqual({
                    name: "Test User",
                    email: "test@example.com",
                })
            })
        })

        describe("files parameter", () => {
            it("should stage specified files before commit", async () => {
                const mockGit = createMockGit({
                    status: createMockStatusResult({ staged: [] }),
                })
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                await toolWithMock.execute(
                    { message: "test", files: ["a.ts", "b.ts"] },
                    ctx,
                )

                expect(mockGit.add).toHaveBeenCalledWith(["a.ts", "b.ts"])
            })

            it("should not call add when files is empty", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                await toolWithMock.execute(
                    { message: "test", files: [] },
                    ctx,
                )

                expect(mockGit.add).not.toHaveBeenCalled()
            })

            it("should handle add errors", async () => {
                const mockGit = createMockGit({
                    addError: new Error("Failed to add files"),
                })
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { message: "test", files: ["nonexistent.ts"] },
                    ctx,
                )

                expect(result.success).toBe(false)
                expect(result.error).toContain("Failed to add files")
            })
        })

        describe("confirmation", () => {
            it("should request confirmation before commit", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                await toolWithMock.execute({ message: "test commit" }, ctx)

                expect(ctx.requestConfirmation).toHaveBeenCalled()
                const confirmMessage = (ctx.requestConfirmation as ReturnType<typeof vi.fn>)
                    .mock.calls[0][0] as string
                expect(confirmMessage).toContain("Committing")
                expect(confirmMessage).toContain("test commit")
            })

            it("should cancel commit when user declines", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext(undefined, false)

                const result = await toolWithMock.execute(
                    { message: "test commit" },
                    ctx,
                )

                expect(result.success).toBe(false)
                expect(result.error).toContain("cancelled")
                expect(mockGit.commit).not.toHaveBeenCalled()
            })

            it("should proceed with commit when user confirms", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext(undefined, true)

                const result = await toolWithMock.execute(
                    { message: "test commit" },
                    ctx,
                )

                expect(result.success).toBe(true)
                expect(mockGit.commit).toHaveBeenCalledWith("test commit")
            })
        })

        describe("error handling", () => {
            it("should handle git command errors", async () => {
                const mockGit = createMockGit({
                    error: new Error("Git commit failed"),
                })
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { message: "test commit" },
                    ctx,
                )

                expect(result.success).toBe(false)
                expect(result.error).toContain("Git commit failed")
            })

            it("should handle non-Error exceptions", async () => {
                const mockGit = {
                    checkIsRepo: vi.fn().mockResolvedValue(true),
                    status: vi.fn().mockResolvedValue(createMockStatusResult()),
                    add: vi.fn(),
                    commit: vi.fn().mockRejectedValue("string error"),
                } as unknown as SimpleGit
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { message: "test commit" },
                    ctx,
                )

                expect(result.success).toBe(false)
                expect(result.error).toBe("string error")
            })
        })

        describe("timing", () => {
            it("should return timing information", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { message: "test commit" },
                    ctx,
                )

                expect(result.executionTimeMs).toBeGreaterThanOrEqual(0)
            })
        })

        describe("call id", () => {
            it("should generate unique call id", async () => {
                const mockGit = createMockGit({})
                const toolWithMock = new GitCommitTool(() => mockGit)
                const ctx = createMockContext()

                const result = await toolWithMock.execute(
                    { message: "test commit" },
                    ctx,
                )

                expect(result.callId).toMatch(/^git_commit-\d+$/)
            })
        })
    })
})
