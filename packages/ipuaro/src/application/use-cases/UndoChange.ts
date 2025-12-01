import { promises as fs } from "node:fs"
import type { Session } from "../../domain/entities/Session.js"
import type { ISessionStorage } from "../../domain/services/ISessionStorage.js"
import type { IStorage } from "../../domain/services/IStorage.js"
import { canUndo, type UndoEntry } from "../../domain/value-objects/UndoEntry.js"
import { md5 } from "../../shared/utils/hash.js"

/**
 * Result of undo operation.
 */
export interface UndoResult {
    success: boolean
    entry?: UndoEntry
    error?: string
}

/**
 * Use case for undoing the last file change.
 */
export class UndoChange {
    constructor(
        private readonly sessionStorage: ISessionStorage,
        private readonly storage: IStorage,
    ) {}

    /**
     * Execute undo operation.
     *
     * @param session - The current session
     * @returns Result of the undo operation
     */
    async execute(session: Session): Promise<UndoResult> {
        const entry = await this.sessionStorage.popUndoEntry(session.id)
        if (!entry) {
            return {
                success: false,
                error: "No changes to undo",
            }
        }

        try {
            const currentContent = await this.readCurrentContent(entry.filePath)

            if (!canUndo(entry, currentContent)) {
                await this.sessionStorage.pushUndoEntry(session.id, entry)
                return {
                    success: false,
                    entry,
                    error: "File has been modified since the change was made",
                }
            }

            await this.restoreContent(entry.filePath, entry.previousContent)

            session.popUndoEntry()
            session.stats.editsApplied--

            return {
                success: true,
                entry,
            }
        } catch (error) {
            await this.sessionStorage.pushUndoEntry(session.id, entry)

            const message = error instanceof Error ? error.message : "Unknown error"
            return {
                success: false,
                entry,
                error: `Failed to undo: ${message}`,
            }
        }
    }

    /**
     * Check if undo is available.
     */
    async canUndo(session: Session): Promise<boolean> {
        const stack = await this.sessionStorage.getUndoStack(session.id)
        return stack.length > 0
    }

    /**
     * Get the next undo entry without removing it.
     */
    async peekUndoEntry(session: Session): Promise<UndoEntry | null> {
        const stack = await this.sessionStorage.getUndoStack(session.id)
        if (stack.length === 0) {
            return null
        }
        return stack[stack.length - 1]
    }

    private async readCurrentContent(filePath: string): Promise<string[]> {
        try {
            const content = await fs.readFile(filePath, "utf-8")
            return content.split("\n")
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return []
            }
            throw error
        }
    }

    private async restoreContent(filePath: string, content: string[]): Promise<void> {
        const fileContent = content.join("\n")
        await fs.writeFile(filePath, fileContent, "utf-8")

        const hash = md5(fileContent)
        const stats = await fs.stat(filePath)

        await this.storage.setFile(filePath, {
            lines: content,
            hash,
            size: stats.size,
            lastModified: stats.mtimeMs,
        })
    }
}
