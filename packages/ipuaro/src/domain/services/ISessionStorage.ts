import type { ContextState, Session, SessionStats } from "../entities/Session.js"
import type { ChatMessage } from "../value-objects/ChatMessage.js"
import type { UndoEntry } from "../value-objects/UndoEntry.js"

/**
 * Session data stored in persistence layer.
 */
export interface SessionData {
    id: string
    projectName: string
    createdAt: number
    lastActivityAt: number
    history: ChatMessage[]
    context: ContextState
    stats: SessionStats
    inputHistory: string[]
}

/**
 * Session list item (minimal info for listing).
 */
export interface SessionListItem {
    id: string
    projectName: string
    createdAt: number
    lastActivityAt: number
    messageCount: number
}

/**
 * Storage service interface for session persistence.
 */
export interface ISessionStorage {
    /**
     * Save a session to storage.
     */
    saveSession(session: Session): Promise<void>

    /**
     * Load a session by ID.
     */
    loadSession(sessionId: string): Promise<Session | null>

    /**
     * Delete a session.
     */
    deleteSession(sessionId: string): Promise<void>

    /**
     * Get list of all sessions for a project.
     */
    listSessions(projectName?: string): Promise<SessionListItem[]>

    /**
     * Get the latest session for a project.
     */
    getLatestSession(projectName: string): Promise<Session | null>

    /**
     * Check if a session exists.
     */
    sessionExists(sessionId: string): Promise<boolean>

    /**
     * Add undo entry to session's undo stack.
     */
    pushUndoEntry(sessionId: string, entry: UndoEntry): Promise<void>

    /**
     * Pop undo entry from session's undo stack.
     */
    popUndoEntry(sessionId: string): Promise<UndoEntry | null>

    /**
     * Get undo stack for a session.
     */
    getUndoStack(sessionId: string): Promise<UndoEntry[]>

    /**
     * Update session's last activity timestamp.
     */
    touchSession(sessionId: string): Promise<void>

    /**
     * Clear all sessions.
     */
    clearAllSessions(): Promise<void>
}
