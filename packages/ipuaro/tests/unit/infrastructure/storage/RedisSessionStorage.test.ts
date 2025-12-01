import { describe, it, expect, vi, beforeEach } from "vitest"
import { RedisSessionStorage } from "../../../../src/infrastructure/storage/RedisSessionStorage.js"
import { RedisClient } from "../../../../src/infrastructure/storage/RedisClient.js"
import { Session } from "../../../../src/domain/entities/Session.js"
import type { UndoEntry } from "../../../../src/domain/value-objects/UndoEntry.js"
import { SessionKeys, SessionFields } from "../../../../src/infrastructure/storage/schema.js"

describe("RedisSessionStorage", () => {
    let storage: RedisSessionStorage
    let mockRedis: {
        hset: ReturnType<typeof vi.fn>
        hget: ReturnType<typeof vi.fn>
        hgetall: ReturnType<typeof vi.fn>
        del: ReturnType<typeof vi.fn>
        lrange: ReturnType<typeof vi.fn>
        lpush: ReturnType<typeof vi.fn>
        lpos: ReturnType<typeof vi.fn>
        lrem: ReturnType<typeof vi.fn>
        rpush: ReturnType<typeof vi.fn>
        rpop: ReturnType<typeof vi.fn>
        llen: ReturnType<typeof vi.fn>
        lpop: ReturnType<typeof vi.fn>
        exists: ReturnType<typeof vi.fn>
        pipeline: ReturnType<typeof vi.fn>
    }
    let mockClient: RedisClient

    beforeEach(() => {
        mockRedis = {
            hset: vi.fn().mockResolvedValue(1),
            hget: vi.fn().mockResolvedValue(null),
            hgetall: vi.fn().mockResolvedValue({}),
            del: vi.fn().mockResolvedValue(1),
            lrange: vi.fn().mockResolvedValue([]),
            lpush: vi.fn().mockResolvedValue(1),
            lpos: vi.fn().mockResolvedValue(null),
            lrem: vi.fn().mockResolvedValue(1),
            rpush: vi.fn().mockResolvedValue(1),
            rpop: vi.fn().mockResolvedValue(null),
            llen: vi.fn().mockResolvedValue(0),
            lpop: vi.fn().mockResolvedValue(null),
            exists: vi.fn().mockResolvedValue(0),
            pipeline: vi.fn().mockReturnValue({
                hset: vi.fn().mockReturnThis(),
                del: vi.fn().mockReturnThis(),
                exec: vi.fn().mockResolvedValue([]),
            }),
        }

        mockClient = {
            getClient: () => mockRedis,
            connect: vi.fn(),
            disconnect: vi.fn(),
            isConnected: vi.fn().mockReturnValue(true),
        } as unknown as RedisClient

        storage = new RedisSessionStorage(mockClient)
    })

    describe("saveSession", () => {
        it("should save session data to Redis", async () => {
            const session = new Session("test-session-1", "test-project")
            session.history = [{ role: "user", content: "Hello", timestamp: Date.now() }]

            await storage.saveSession(session)

            const pipeline = mockRedis.pipeline()
            expect(pipeline.hset).toHaveBeenCalled()
            expect(pipeline.exec).toHaveBeenCalled()
        })

        it("should add session to list if not exists", async () => {
            const session = new Session("test-session-2", "test-project")

            await storage.saveSession(session)

            expect(mockRedis.lpos).toHaveBeenCalledWith(SessionKeys.list, "test-session-2")
            expect(mockRedis.lpush).toHaveBeenCalledWith(SessionKeys.list, "test-session-2")
        })

        it("should not add session to list if already exists", async () => {
            const session = new Session("existing-session", "test-project")
            mockRedis.lpos.mockResolvedValue(0)

            await storage.saveSession(session)

            expect(mockRedis.lpush).not.toHaveBeenCalled()
        })
    })

    describe("loadSession", () => {
        it("should return null for non-existent session", async () => {
            mockRedis.hgetall.mockResolvedValue({})

            const result = await storage.loadSession("non-existent")

            expect(result).toBeNull()
        })

        it("should load session from Redis", async () => {
            const sessionData = {
                [SessionFields.projectName]: "test-project",
                [SessionFields.createdAt]: "1700000000000",
                [SessionFields.lastActivityAt]: "1700001000000",
                [SessionFields.history]: "[]",
                [SessionFields.context]: JSON.stringify({
                    filesInContext: [],
                    tokenUsage: 0,
                    needsCompression: false,
                }),
                [SessionFields.stats]: JSON.stringify({
                    totalTokens: 0,
                    totalTimeMs: 0,
                    toolCalls: 0,
                    editsApplied: 0,
                    editsRejected: 0,
                }),
                [SessionFields.inputHistory]: "[]",
            }
            mockRedis.hgetall.mockResolvedValue(sessionData)
            mockRedis.lrange.mockResolvedValue([])

            const result = await storage.loadSession("test-session")

            expect(result).not.toBeNull()
            expect(result?.id).toBe("test-session")
            expect(result?.projectName).toBe("test-project")
            expect(result?.createdAt).toBe(1700000000000)
        })

        it("should load undo stack with session", async () => {
            const sessionData = {
                [SessionFields.projectName]: "test-project",
                [SessionFields.createdAt]: "1700000000000",
                [SessionFields.lastActivityAt]: "1700001000000",
                [SessionFields.history]: "[]",
                [SessionFields.context]: "{}",
                [SessionFields.stats]: "{}",
                [SessionFields.inputHistory]: "[]",
            }
            const undoEntry: UndoEntry = {
                id: "undo-1",
                timestamp: Date.now(),
                filePath: "test.ts",
                previousContent: ["old"],
                newContent: ["new"],
                description: "Edit",
            }
            mockRedis.hgetall.mockResolvedValue(sessionData)
            mockRedis.lrange.mockResolvedValue([JSON.stringify(undoEntry)])

            const result = await storage.loadSession("test-session")

            expect(result?.undoStack).toHaveLength(1)
            expect(result?.undoStack[0].id).toBe("undo-1")
        })
    })

    describe("deleteSession", () => {
        it("should delete session data and undo stack", async () => {
            await storage.deleteSession("test-session")

            expect(mockRedis.del).toHaveBeenCalledWith(SessionKeys.data("test-session"))
            expect(mockRedis.del).toHaveBeenCalledWith(SessionKeys.undo("test-session"))
            expect(mockRedis.lrem).toHaveBeenCalledWith(SessionKeys.list, 0, "test-session")
        })
    })

    describe("listSessions", () => {
        it("should return empty array when no sessions", async () => {
            mockRedis.lrange.mockResolvedValue([])

            const result = await storage.listSessions()

            expect(result).toEqual([])
        })

        it("should list all sessions", async () => {
            mockRedis.lrange.mockResolvedValue(["session-1", "session-2"])
            mockRedis.hgetall.mockImplementation((key: string) => {
                if (key.includes("session-1")) {
                    return Promise.resolve({
                        [SessionFields.projectName]: "project-1",
                        [SessionFields.createdAt]: "1700000000000",
                        [SessionFields.lastActivityAt]: "1700001000000",
                        [SessionFields.history]: "[]",
                    })
                }
                if (key.includes("session-2")) {
                    return Promise.resolve({
                        [SessionFields.projectName]: "project-2",
                        [SessionFields.createdAt]: "1700002000000",
                        [SessionFields.lastActivityAt]: "1700003000000",
                        [SessionFields.history]: '[{"role":"user","content":"Hi"}]',
                    })
                }
                return Promise.resolve({})
            })

            const result = await storage.listSessions()

            expect(result).toHaveLength(2)
            expect(result[0].id).toBe("session-2")
            expect(result[1].id).toBe("session-1")
        })

        it("should filter by project name", async () => {
            mockRedis.lrange.mockResolvedValue(["session-1", "session-2"])
            mockRedis.hgetall.mockImplementation((key: string) => {
                if (key.includes("session-1")) {
                    return Promise.resolve({
                        [SessionFields.projectName]: "project-1",
                        [SessionFields.createdAt]: "1700000000000",
                        [SessionFields.lastActivityAt]: "1700001000000",
                        [SessionFields.history]: "[]",
                    })
                }
                if (key.includes("session-2")) {
                    return Promise.resolve({
                        [SessionFields.projectName]: "project-2",
                        [SessionFields.createdAt]: "1700002000000",
                        [SessionFields.lastActivityAt]: "1700003000000",
                        [SessionFields.history]: "[]",
                    })
                }
                return Promise.resolve({})
            })

            const result = await storage.listSessions("project-1")

            expect(result).toHaveLength(1)
            expect(result[0].projectName).toBe("project-1")
        })
    })

    describe("getLatestSession", () => {
        it("should return null when no sessions", async () => {
            mockRedis.lrange.mockResolvedValue([])

            const result = await storage.getLatestSession("test-project")

            expect(result).toBeNull()
        })

        it("should return the most recent session", async () => {
            mockRedis.lrange.mockImplementation((key: string) => {
                if (key === SessionKeys.list) {
                    return Promise.resolve(["session-1"])
                }
                return Promise.resolve([])
            })
            mockRedis.hgetall.mockResolvedValue({
                [SessionFields.projectName]: "test-project",
                [SessionFields.createdAt]: "1700000000000",
                [SessionFields.lastActivityAt]: "1700001000000",
                [SessionFields.history]: "[]",
                [SessionFields.context]: "{}",
                [SessionFields.stats]: "{}",
                [SessionFields.inputHistory]: "[]",
            })

            const result = await storage.getLatestSession("test-project")

            expect(result).not.toBeNull()
            expect(result?.id).toBe("session-1")
        })
    })

    describe("sessionExists", () => {
        it("should return false for non-existent session", async () => {
            mockRedis.exists.mockResolvedValue(0)

            const result = await storage.sessionExists("non-existent")

            expect(result).toBe(false)
        })

        it("should return true for existing session", async () => {
            mockRedis.exists.mockResolvedValue(1)

            const result = await storage.sessionExists("existing")

            expect(result).toBe(true)
        })
    })

    describe("undo stack operations", () => {
        const undoEntry: UndoEntry = {
            id: "undo-1",
            timestamp: Date.now(),
            filePath: "test.ts",
            previousContent: ["old"],
            newContent: ["new"],
            description: "Edit",
        }

        describe("pushUndoEntry", () => {
            it("should push undo entry to stack", async () => {
                mockRedis.llen.mockResolvedValue(1)

                await storage.pushUndoEntry("session-1", undoEntry)

                expect(mockRedis.rpush).toHaveBeenCalledWith(
                    SessionKeys.undo("session-1"),
                    JSON.stringify(undoEntry),
                )
            })

            it("should remove oldest entry when stack exceeds limit", async () => {
                mockRedis.llen.mockResolvedValue(11)

                await storage.pushUndoEntry("session-1", undoEntry)

                expect(mockRedis.lpop).toHaveBeenCalledWith(SessionKeys.undo("session-1"))
            })
        })

        describe("popUndoEntry", () => {
            it("should return null for empty stack", async () => {
                mockRedis.rpop.mockResolvedValue(null)

                const result = await storage.popUndoEntry("session-1")

                expect(result).toBeNull()
            })

            it("should pop and return undo entry", async () => {
                mockRedis.rpop.mockResolvedValue(JSON.stringify(undoEntry))

                const result = await storage.popUndoEntry("session-1")

                expect(result).not.toBeNull()
                expect(result?.id).toBe("undo-1")
            })
        })

        describe("getUndoStack", () => {
            it("should return empty array for empty stack", async () => {
                mockRedis.lrange.mockResolvedValue([])

                const result = await storage.getUndoStack("session-1")

                expect(result).toEqual([])
            })

            it("should return all undo entries", async () => {
                mockRedis.lrange.mockResolvedValue([
                    JSON.stringify({ ...undoEntry, id: "undo-1" }),
                    JSON.stringify({ ...undoEntry, id: "undo-2" }),
                ])

                const result = await storage.getUndoStack("session-1")

                expect(result).toHaveLength(2)
                expect(result[0].id).toBe("undo-1")
                expect(result[1].id).toBe("undo-2")
            })
        })
    })

    describe("touchSession", () => {
        it("should update last activity timestamp", async () => {
            const beforeTouch = Date.now()

            await storage.touchSession("session-1")

            expect(mockRedis.hset).toHaveBeenCalledWith(
                SessionKeys.data("session-1"),
                SessionFields.lastActivityAt,
                expect.any(String),
            )

            const callArgs = mockRedis.hset.mock.calls[0]
            const timestamp = Number(callArgs[2])
            expect(timestamp).toBeGreaterThanOrEqual(beforeTouch)
        })
    })

    describe("clearAllSessions", () => {
        it("should clear all session data", async () => {
            mockRedis.lrange.mockResolvedValue(["session-1", "session-2"])

            await storage.clearAllSessions()

            const pipeline = mockRedis.pipeline()
            expect(pipeline.del).toHaveBeenCalled()
            expect(pipeline.exec).toHaveBeenCalled()
        })
    })
})
