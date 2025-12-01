import { randomUUID } from "node:crypto"
import { Session } from "../../domain/entities/Session.js"
import type { ISessionStorage } from "../../domain/services/ISessionStorage.js"

/**
 * Options for starting a session.
 */
export interface StartSessionOptions {
    /** Force creation of a new session even if one exists */
    forceNew?: boolean
    /** Specific session ID to load */
    sessionId?: string
}

/**
 * Result of starting a session.
 */
export interface StartSessionResult {
    session: Session
    isNew: boolean
}

/**
 * Use case for starting a session.
 * Creates a new session or loads the latest one for a project.
 */
export class StartSession {
    constructor(private readonly sessionStorage: ISessionStorage) {}

    /**
     * Execute the use case.
     *
     * @param projectName - The project name to start a session for
     * @param options - Optional configuration
     * @returns The session and whether it was newly created
     */
    async execute(
        projectName: string,
        options: StartSessionOptions = {},
    ): Promise<StartSessionResult> {
        if (options.sessionId) {
            const session = await this.sessionStorage.loadSession(options.sessionId)
            if (session) {
                await this.sessionStorage.touchSession(session.id)
                return { session, isNew: false }
            }
        }

        if (!options.forceNew) {
            const latestSession = await this.sessionStorage.getLatestSession(projectName)
            if (latestSession) {
                await this.sessionStorage.touchSession(latestSession.id)
                return { session: latestSession, isNew: false }
            }
        }

        const session = new Session(randomUUID(), projectName)
        await this.sessionStorage.saveSession(session)

        return { session, isNew: true }
    }
}
