import { describe, it, expect, vi, beforeEach } from "vitest"
import { StartSession } from "../../../../src/application/use-cases/StartSession.js"
import type { ISessionStorage } from "../../../../src/domain/services/ISessionStorage.js"
import { Session } from "../../../../src/domain/entities/Session.js"

describe("StartSession", () => {
    let useCase: StartSession
    let mockSessionStorage: ISessionStorage

    beforeEach(() => {
        mockSessionStorage = {
            saveSession: vi.fn().mockResolvedValue(undefined),
            loadSession: vi.fn().mockResolvedValue(null),
            deleteSession: vi.fn().mockResolvedValue(undefined),
            listSessions: vi.fn().mockResolvedValue([]),
            getLatestSession: vi.fn().mockResolvedValue(null),
            sessionExists: vi.fn().mockResolvedValue(false),
            pushUndoEntry: vi.fn().mockResolvedValue(undefined),
            popUndoEntry: vi.fn().mockResolvedValue(null),
            getUndoStack: vi.fn().mockResolvedValue([]),
            touchSession: vi.fn().mockResolvedValue(undefined),
            clearAllSessions: vi.fn().mockResolvedValue(undefined),
        }

        useCase = new StartSession(mockSessionStorage)
    })

    describe("execute", () => {
        it("should create new session when no existing session", async () => {
            const result = await useCase.execute("test-project")

            expect(result.isNew).toBe(true)
            expect(result.session.projectName).toBe("test-project")
            expect(mockSessionStorage.saveSession).toHaveBeenCalled()
        })

        it("should return latest session when one exists", async () => {
            const existingSession = new Session("existing-id", "test-project")
            vi.mocked(mockSessionStorage.getLatestSession).mockResolvedValue(existingSession)

            const result = await useCase.execute("test-project")

            expect(result.isNew).toBe(false)
            expect(result.session.id).toBe("existing-id")
            expect(mockSessionStorage.touchSession).toHaveBeenCalledWith("existing-id")
        })

        it("should load specific session by ID", async () => {
            const specificSession = new Session("specific-id", "test-project")
            vi.mocked(mockSessionStorage.loadSession).mockResolvedValue(specificSession)

            const result = await useCase.execute("test-project", { sessionId: "specific-id" })

            expect(result.isNew).toBe(false)
            expect(result.session.id).toBe("specific-id")
            expect(mockSessionStorage.loadSession).toHaveBeenCalledWith("specific-id")
        })

        it("should create new session when specified session not found", async () => {
            vi.mocked(mockSessionStorage.loadSession).mockResolvedValue(null)

            const result = await useCase.execute("test-project", { sessionId: "non-existent" })

            expect(result.isNew).toBe(true)
            expect(mockSessionStorage.saveSession).toHaveBeenCalled()
        })

        it("should force new session when forceNew is true", async () => {
            const existingSession = new Session("existing-id", "test-project")
            vi.mocked(mockSessionStorage.getLatestSession).mockResolvedValue(existingSession)

            const result = await useCase.execute("test-project", { forceNew: true })

            expect(result.isNew).toBe(true)
            expect(result.session.id).not.toBe("existing-id")
            expect(mockSessionStorage.saveSession).toHaveBeenCalled()
        })

        it("should generate unique session IDs", async () => {
            const result1 = await useCase.execute("test-project", { forceNew: true })
            const result2 = await useCase.execute("test-project", { forceNew: true })

            expect(result1.session.id).not.toBe(result2.session.id)
        })

        it("should set correct project name on new session", async () => {
            const result = await useCase.execute("my-special-project")

            expect(result.session.projectName).toBe("my-special-project")
        })

        it("should initialize new session with empty history", async () => {
            const result = await useCase.execute("test-project")

            expect(result.session.history).toEqual([])
        })

        it("should initialize new session with empty undo stack", async () => {
            const result = await useCase.execute("test-project")

            expect(result.session.undoStack).toEqual([])
        })

        it("should initialize new session with zero stats", async () => {
            const result = await useCase.execute("test-project")

            expect(result.session.stats.totalTokens).toBe(0)
            expect(result.session.stats.toolCalls).toBe(0)
            expect(result.session.stats.editsApplied).toBe(0)
        })
    })
})
