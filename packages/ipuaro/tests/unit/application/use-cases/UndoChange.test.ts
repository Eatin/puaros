import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { promises as fs } from "node:fs"
import { UndoChange } from "../../../../src/application/use-cases/UndoChange.js"
import type { ISessionStorage } from "../../../../src/domain/services/ISessionStorage.js"
import type { IStorage } from "../../../../src/domain/services/IStorage.js"
import { Session } from "../../../../src/domain/entities/Session.js"
import type { UndoEntry } from "../../../../src/domain/value-objects/UndoEntry.js"

vi.mock("node:fs", () => ({
    promises: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        stat: vi.fn(),
    },
}))

describe("UndoChange", () => {
    let useCase: UndoChange
    let mockSessionStorage: ISessionStorage
    let mockStorage: IStorage
    let session: Session

    const createUndoEntry = (overrides: Partial<UndoEntry> = {}): UndoEntry => ({
        id: "undo-1",
        timestamp: Date.now(),
        filePath: "/project/test.ts",
        previousContent: ["const a = 1"],
        newContent: ["const a = 2"],
        description: "Edit test.ts",
        ...overrides,
    })

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

        session = new Session("test-session", "test-project")
        session.stats.editsApplied = 1

        useCase = new UndoChange(mockSessionStorage, mockStorage)

        vi.mocked(fs.stat).mockResolvedValue({
            size: 100,
            mtimeMs: Date.now(),
        } as unknown as Awaited<ReturnType<typeof fs.stat>>)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    describe("execute", () => {
        it("should return error when no undo entries", async () => {
            vi.mocked(mockSessionStorage.popUndoEntry).mockResolvedValue(null)

            const result = await useCase.execute(session)

            expect(result.success).toBe(false)
            expect(result.error).toBe("No changes to undo")
        })

        it("should restore previous content when file matches", async () => {
            const entry = createUndoEntry()
            vi.mocked(mockSessionStorage.popUndoEntry).mockResolvedValue(entry)
            vi.mocked(fs.readFile).mockResolvedValue("const a = 2")
            vi.mocked(fs.writeFile).mockResolvedValue(undefined)

            session.addUndoEntry(entry)

            const result = await useCase.execute(session)

            expect(result.success).toBe(true)
            expect(result.entry).toBe(entry)
            expect(fs.writeFile).toHaveBeenCalledWith(entry.filePath, "const a = 1", "utf-8")
        })

        it("should update storage after undo", async () => {
            const entry = createUndoEntry()
            vi.mocked(mockSessionStorage.popUndoEntry).mockResolvedValue(entry)
            vi.mocked(fs.readFile).mockResolvedValue("const a = 2")
            vi.mocked(fs.writeFile).mockResolvedValue(undefined)

            session.addUndoEntry(entry)

            await useCase.execute(session)

            expect(mockStorage.setFile).toHaveBeenCalledWith(
                entry.filePath,
                expect.objectContaining({
                    lines: entry.previousContent,
                }),
            )
        })

        it("should decrement editsApplied counter", async () => {
            const entry = createUndoEntry()
            vi.mocked(mockSessionStorage.popUndoEntry).mockResolvedValue(entry)
            vi.mocked(fs.readFile).mockResolvedValue("const a = 2")
            vi.mocked(fs.writeFile).mockResolvedValue(undefined)

            session.addUndoEntry(entry)
            const initialEdits = session.stats.editsApplied

            await useCase.execute(session)

            expect(session.stats.editsApplied).toBe(initialEdits - 1)
        })

        it("should fail when file has been modified externally", async () => {
            const entry = createUndoEntry()
            vi.mocked(mockSessionStorage.popUndoEntry).mockResolvedValue(entry)
            vi.mocked(fs.readFile).mockResolvedValue("const a = 999")

            const result = await useCase.execute(session)

            expect(result.success).toBe(false)
            expect(result.error).toContain("modified since the change")
        })

        it("should re-push undo entry on conflict", async () => {
            const entry = createUndoEntry()
            vi.mocked(mockSessionStorage.popUndoEntry).mockResolvedValue(entry)
            vi.mocked(fs.readFile).mockResolvedValue("const a = 999")

            await useCase.execute(session)

            expect(mockSessionStorage.pushUndoEntry).toHaveBeenCalledWith(session.id, entry)
        })

        it("should handle empty file for undo", async () => {
            const entry = createUndoEntry({
                previousContent: [],
                newContent: ["new content"],
            })
            vi.mocked(mockSessionStorage.popUndoEntry).mockResolvedValue(entry)
            vi.mocked(fs.readFile).mockResolvedValue("new content")
            vi.mocked(fs.writeFile).mockResolvedValue(undefined)

            session.addUndoEntry(entry)

            const result = await useCase.execute(session)

            expect(result.success).toBe(true)
            expect(fs.writeFile).toHaveBeenCalledWith(entry.filePath, "", "utf-8")
        })

        it("should handle file not found during undo", async () => {
            const entry = createUndoEntry()
            vi.mocked(mockSessionStorage.popUndoEntry).mockResolvedValue(entry)
            const error = new Error("ENOENT") as NodeJS.ErrnoException
            error.code = "ENOENT"
            vi.mocked(fs.readFile).mockRejectedValue(error)

            const result = await useCase.execute(session)

            expect(result.success).toBe(false)
        })
    })

    describe("canUndo", () => {
        it("should return false when stack is empty", async () => {
            vi.mocked(mockSessionStorage.getUndoStack).mockResolvedValue([])

            const result = await useCase.canUndo(session)

            expect(result).toBe(false)
        })

        it("should return true when stack has entries", async () => {
            vi.mocked(mockSessionStorage.getUndoStack).mockResolvedValue([createUndoEntry()])

            const result = await useCase.canUndo(session)

            expect(result).toBe(true)
        })
    })

    describe("peekUndoEntry", () => {
        it("should return null when stack is empty", async () => {
            vi.mocked(mockSessionStorage.getUndoStack).mockResolvedValue([])

            const result = await useCase.peekUndoEntry(session)

            expect(result).toBeNull()
        })

        it("should return last entry without removing", async () => {
            const entry = createUndoEntry()
            vi.mocked(mockSessionStorage.getUndoStack).mockResolvedValue([entry])

            const result = await useCase.peekUndoEntry(session)

            expect(result).toBe(entry)
            expect(mockSessionStorage.popUndoEntry).not.toHaveBeenCalled()
        })
    })
})
