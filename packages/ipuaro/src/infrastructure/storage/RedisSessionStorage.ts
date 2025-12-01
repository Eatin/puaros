import type { ISessionStorage, SessionListItem } from "../../domain/services/ISessionStorage.js"
import { type ContextState, Session, type SessionStats } from "../../domain/entities/Session.js"
import type { ChatMessage } from "../../domain/value-objects/ChatMessage.js"
import type { UndoEntry } from "../../domain/value-objects/UndoEntry.js"
import { MAX_UNDO_STACK_SIZE } from "../../domain/constants/index.js"
import { IpuaroError } from "../../shared/errors/IpuaroError.js"
import { RedisClient } from "./RedisClient.js"
import { SessionFields, SessionKeys } from "./schema.js"

/**
 * Redis implementation of ISessionStorage.
 * Stores session data in Redis hashes and lists.
 */
export class RedisSessionStorage implements ISessionStorage {
    private readonly client: RedisClient

    constructor(client: RedisClient) {
        this.client = client
    }

    async saveSession(session: Session): Promise<void> {
        const redis = this.getRedis()
        const dataKey = SessionKeys.data(session.id)

        const pipeline = redis.pipeline()

        pipeline.hset(dataKey, SessionFields.projectName, session.projectName)
        pipeline.hset(dataKey, SessionFields.createdAt, String(session.createdAt))
        pipeline.hset(dataKey, SessionFields.lastActivityAt, String(session.lastActivityAt))
        pipeline.hset(dataKey, SessionFields.history, JSON.stringify(session.history))
        pipeline.hset(dataKey, SessionFields.context, JSON.stringify(session.context))
        pipeline.hset(dataKey, SessionFields.stats, JSON.stringify(session.stats))
        pipeline.hset(dataKey, SessionFields.inputHistory, JSON.stringify(session.inputHistory))

        await this.addToSessionsList(session.id)

        await pipeline.exec()
    }

    async loadSession(sessionId: string): Promise<Session | null> {
        const redis = this.getRedis()
        const dataKey = SessionKeys.data(sessionId)

        const data = await redis.hgetall(dataKey)
        if (!data || Object.keys(data).length === 0) {
            return null
        }

        const session = new Session(
            sessionId,
            data[SessionFields.projectName],
            Number(data[SessionFields.createdAt]),
        )

        session.lastActivityAt = Number(data[SessionFields.lastActivityAt])
        session.history = this.parseJSON(data[SessionFields.history], "history") as ChatMessage[]
        session.context = this.parseJSON(data[SessionFields.context], "context") as ContextState
        session.stats = this.parseJSON(data[SessionFields.stats], "stats") as SessionStats
        session.inputHistory = this.parseJSON(
            data[SessionFields.inputHistory],
            "inputHistory",
        ) as string[]

        const undoStack = await this.getUndoStack(sessionId)
        for (const entry of undoStack) {
            session.undoStack.push(entry)
        }

        return session
    }

    async deleteSession(sessionId: string): Promise<void> {
        const redis = this.getRedis()

        await Promise.all([
            redis.del(SessionKeys.data(sessionId)),
            redis.del(SessionKeys.undo(sessionId)),
            redis.lrem(SessionKeys.list, 0, sessionId),
        ])
    }

    async listSessions(projectName?: string): Promise<SessionListItem[]> {
        const redis = this.getRedis()
        const sessionIds = await redis.lrange(SessionKeys.list, 0, -1)

        const sessions: SessionListItem[] = []

        for (const id of sessionIds) {
            const data = await redis.hgetall(SessionKeys.data(id))
            if (!data || Object.keys(data).length === 0) {
                continue
            }

            const sessionProjectName = data[SessionFields.projectName]
            if (projectName && sessionProjectName !== projectName) {
                continue
            }

            const history = this.parseJSON(data[SessionFields.history], "history") as ChatMessage[]

            sessions.push({
                id,
                projectName: sessionProjectName,
                createdAt: Number(data[SessionFields.createdAt]),
                lastActivityAt: Number(data[SessionFields.lastActivityAt]),
                messageCount: history.length,
            })
        }

        sessions.sort((a, b) => b.lastActivityAt - a.lastActivityAt)

        return sessions
    }

    async getLatestSession(projectName: string): Promise<Session | null> {
        const sessions = await this.listSessions(projectName)
        if (sessions.length === 0) {
            return null
        }

        return this.loadSession(sessions[0].id)
    }

    async sessionExists(sessionId: string): Promise<boolean> {
        const redis = this.getRedis()
        const exists = await redis.exists(SessionKeys.data(sessionId))
        return exists === 1
    }

    async pushUndoEntry(sessionId: string, entry: UndoEntry): Promise<void> {
        const redis = this.getRedis()
        const undoKey = SessionKeys.undo(sessionId)

        await redis.rpush(undoKey, JSON.stringify(entry))

        const length = await redis.llen(undoKey)
        if (length > MAX_UNDO_STACK_SIZE) {
            await redis.lpop(undoKey)
        }
    }

    async popUndoEntry(sessionId: string): Promise<UndoEntry | null> {
        const redis = this.getRedis()
        const undoKey = SessionKeys.undo(sessionId)

        const data = await redis.rpop(undoKey)
        if (!data) {
            return null
        }

        return this.parseJSON(data, "UndoEntry") as UndoEntry
    }

    async getUndoStack(sessionId: string): Promise<UndoEntry[]> {
        const redis = this.getRedis()
        const undoKey = SessionKeys.undo(sessionId)

        const entries = await redis.lrange(undoKey, 0, -1)
        return entries.map((entry) => this.parseJSON(entry, "UndoEntry") as UndoEntry)
    }

    async touchSession(sessionId: string): Promise<void> {
        const redis = this.getRedis()
        await redis.hset(
            SessionKeys.data(sessionId),
            SessionFields.lastActivityAt,
            String(Date.now()),
        )
    }

    async clearAllSessions(): Promise<void> {
        const redis = this.getRedis()
        const sessionIds = await redis.lrange(SessionKeys.list, 0, -1)

        const pipeline = redis.pipeline()
        for (const id of sessionIds) {
            pipeline.del(SessionKeys.data(id))
            pipeline.del(SessionKeys.undo(id))
        }
        pipeline.del(SessionKeys.list)

        await pipeline.exec()
    }

    private async addToSessionsList(sessionId: string): Promise<void> {
        const redis = this.getRedis()

        const exists = await redis.lpos(SessionKeys.list, sessionId)
        if (exists === null) {
            await redis.lpush(SessionKeys.list, sessionId)
        }
    }

    private getRedis(): ReturnType<RedisClient["getClient"]> {
        return this.client.getClient()
    }

    private parseJSON(data: string | undefined, type: string): unknown {
        if (!data) {
            if (type === "history" || type === "inputHistory") {
                return []
            }
            if (type === "context") {
                return { filesInContext: [], tokenUsage: 0, needsCompression: false }
            }
            if (type === "stats") {
                return {
                    totalTokens: 0,
                    totalTimeMs: 0,
                    toolCalls: 0,
                    editsApplied: 0,
                    editsRejected: 0,
                }
            }
            return null
        }

        try {
            return JSON.parse(data) as unknown
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error"
            throw IpuaroError.parse(`Failed to parse ${type}: ${message}`)
        }
    }
}
