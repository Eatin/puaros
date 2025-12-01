/**
 * useCommands hook for TUI.
 * Handles slash commands (/help, /clear, /undo, etc.)
 */

import { useCallback, useMemo } from "react"
import type { Session } from "../../domain/entities/Session.js"
import type { ILLMClient } from "../../domain/services/ILLMClient.js"
import type { ISessionStorage } from "../../domain/services/ISessionStorage.js"
import type { IStorage } from "../../domain/services/IStorage.js"
import type { IToolRegistry } from "../../application/interfaces/IToolRegistry.js"

/**
 * Command result returned after execution.
 */
export interface CommandResult {
    success: boolean
    message: string
    data?: unknown
}

/**
 * Command definition.
 */
export interface CommandDefinition {
    name: string
    description: string
    usage: string
    execute: (args: string[]) => Promise<CommandResult>
}

/**
 * Dependencies for useCommands hook.
 */
export interface UseCommandsDependencies {
    session: Session | null
    sessionStorage: ISessionStorage
    storage: IStorage
    llm: ILLMClient
    tools: IToolRegistry
    projectRoot: string
    projectName: string
}

/**
 * Actions provided by the parent component.
 */
export interface UseCommandsActions {
    clearHistory: () => void
    undo: () => Promise<boolean>
    setAutoApply: (value: boolean) => void
    reindex: () => Promise<void>
}

/**
 * Options for useCommands hook.
 */
export interface UseCommandsOptions {
    autoApply: boolean
}

/**
 * Return type for useCommands hook.
 */
export interface UseCommandsReturn {
    executeCommand: (input: string) => Promise<CommandResult | null>
    isCommand: (input: string) => boolean
    getCommands: () => CommandDefinition[]
}

/**
 * Parses command input into command name and arguments.
 */
export function parseCommand(input: string): { command: string; args: string[] } | null {
    const trimmed = input.trim()
    if (!trimmed.startsWith("/")) {
        return null
    }

    const parts = trimmed.slice(1).split(/\s+/)
    const command = parts[0]?.toLowerCase() ?? ""
    const args = parts.slice(1)

    return { command, args }
}

// Command factory functions to keep the hook clean and under line limits

function createHelpCommand(map: Map<string, CommandDefinition>): CommandDefinition {
    return {
        name: "help",
        description: "Shows all commands and hotkeys",
        usage: "/help",
        execute: async (): Promise<CommandResult> => {
            const commandList = Array.from(map.values())
                .map((cmd) => `  ${cmd.usage.padEnd(25)} ${cmd.description}`)
                .join("\n")

            const hotkeys = [
                "  Ctrl+C (1x)              Interrupt current operation",
                "  Ctrl+C (2x)              Exit ipuaro",
                "  Ctrl+D                   Exit with session save",
                "  Ctrl+Z                   Undo last change",
                "  ↑/↓                      Navigate input history",
            ].join("\n")

            const message = ["Available commands:", commandList, "", "Hotkeys:", hotkeys].join("\n")

            return Promise.resolve({ success: true, message })
        },
    }
}

function createClearCommand(actions: UseCommandsActions): CommandDefinition {
    return {
        name: "clear",
        description: "Clears chat history (keeps session)",
        usage: "/clear",
        execute: async (): Promise<CommandResult> => {
            actions.clearHistory()
            return Promise.resolve({ success: true, message: "Chat history cleared." })
        },
    }
}

function createUndoCommand(
    deps: UseCommandsDependencies,
    actions: UseCommandsActions,
): CommandDefinition {
    return {
        name: "undo",
        description: "Reverts last file change",
        usage: "/undo",
        execute: async (): Promise<CommandResult> => {
            if (!deps.session) {
                return { success: false, message: "No active session." }
            }

            const undoStack = deps.session.undoStack
            if (undoStack.length === 0) {
                return { success: false, message: "Nothing to undo." }
            }

            const result = await actions.undo()
            if (result) {
                return { success: true, message: "Last change reverted." }
            }
            return { success: false, message: "Failed to undo. File may have been modified." }
        },
    }
}

function createSessionsCommand(deps: UseCommandsDependencies): CommandDefinition {
    return {
        name: "sessions",
        description: "Manage sessions (list, load <id>, delete <id>)",
        usage: "/sessions [list|load|delete] [id]",
        execute: async (args: string[]): Promise<CommandResult> => {
            const subCommand = args[0]?.toLowerCase() ?? "list"

            if (subCommand === "list") {
                return handleSessionsList(deps)
            }

            if (subCommand === "load") {
                return handleSessionsLoad(deps, args[1])
            }

            if (subCommand === "delete") {
                return handleSessionsDelete(deps, args[1])
            }

            return { success: false, message: "Usage: /sessions [list|load|delete] [id]" }
        },
    }
}

async function handleSessionsList(deps: UseCommandsDependencies): Promise<CommandResult> {
    const sessions = await deps.sessionStorage.listSessions(deps.projectName)
    if (sessions.length === 0) {
        return { success: true, message: "No sessions found." }
    }

    const currentId = deps.session?.id
    const sessionList = sessions
        .map((s) => {
            const current = s.id === currentId ? " (current)" : ""
            const date = new Date(s.createdAt).toLocaleString()
            return `  ${s.id.slice(0, 8)}${current} - ${date} - ${String(s.messageCount)} messages`
        })
        .join("\n")

    return {
        success: true,
        message: `Sessions for ${deps.projectName}:\n${sessionList}`,
        data: sessions,
    }
}

async function handleSessionsLoad(
    deps: UseCommandsDependencies,
    sessionId: string | undefined,
): Promise<CommandResult> {
    if (!sessionId) {
        return { success: false, message: "Usage: /sessions load <id>" }
    }

    const exists = await deps.sessionStorage.sessionExists(sessionId)
    if (!exists) {
        return { success: false, message: `Session ${sessionId} not found.` }
    }

    return {
        success: true,
        message: `To load session ${sessionId}, restart ipuaro with --session ${sessionId}`,
        data: { sessionId },
    }
}

async function handleSessionsDelete(
    deps: UseCommandsDependencies,
    sessionId: string | undefined,
): Promise<CommandResult> {
    if (!sessionId) {
        return { success: false, message: "Usage: /sessions delete <id>" }
    }

    if (deps.session?.id === sessionId) {
        return { success: false, message: "Cannot delete current session." }
    }

    const exists = await deps.sessionStorage.sessionExists(sessionId)
    if (!exists) {
        return { success: false, message: `Session ${sessionId} not found.` }
    }

    await deps.sessionStorage.deleteSession(sessionId)
    return { success: true, message: `Session ${sessionId} deleted.` }
}

function createStatusCommand(
    deps: UseCommandsDependencies,
    options: UseCommandsOptions,
): CommandDefinition {
    return {
        name: "status",
        description: "Shows system and session status",
        usage: "/status",
        execute: async (): Promise<CommandResult> => {
            const llmAvailable = await deps.llm.isAvailable()
            const llmStatus = llmAvailable ? "connected" : "unavailable"

            const contextUsage = deps.session?.context.tokenUsage ?? 0
            const contextPercent = Math.round(contextUsage * 100)

            const sessionStats = deps.session?.stats ?? {
                totalTokens: 0,
                totalTime: 0,
                toolCalls: 0,
                editsApplied: 0,
                editsRejected: 0,
            }

            const undoCount = deps.session?.undoStack.length ?? 0

            const message = [
                "System Status:",
                `  LLM:          ${llmStatus}`,
                `  Context:      ${String(contextPercent)}% used`,
                `  Auto-apply:   ${options.autoApply ? "on" : "off"}`,
                "",
                "Session Stats:",
                `  Tokens:       ${sessionStats.totalTokens.toLocaleString()}`,
                `  Tool calls:   ${String(sessionStats.toolCalls)}`,
                `  Edits:        ${String(sessionStats.editsApplied)} applied, ${String(sessionStats.editsRejected)} rejected`,
                `  Undo stack:   ${String(undoCount)} entries`,
                "",
                "Project:",
                `  Name:         ${deps.projectName}`,
                `  Root:         ${deps.projectRoot}`,
            ].join("\n")

            return { success: true, message }
        },
    }
}

function createReindexCommand(actions: UseCommandsActions): CommandDefinition {
    return {
        name: "reindex",
        description: "Forces full project reindexation",
        usage: "/reindex",
        execute: async (): Promise<CommandResult> => {
            try {
                await actions.reindex()
                return { success: true, message: "Project reindexed successfully." }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err)
                return { success: false, message: `Reindex failed: ${errorMessage}` }
            }
        },
    }
}

function createEvalCommand(deps: UseCommandsDependencies): CommandDefinition {
    return {
        name: "eval",
        description: "LLM self-check for hallucinations",
        usage: "/eval",
        execute: async (): Promise<CommandResult> => {
            if (!deps.session || deps.session.history.length === 0) {
                return { success: false, message: "No conversation to evaluate." }
            }

            const lastAssistantMessage = [...deps.session.history]
                .reverse()
                .find((m) => m.role === "assistant")

            if (!lastAssistantMessage) {
                return { success: false, message: "No assistant response to evaluate." }
            }

            const evalPrompt = [
                "Review your last response for potential issues:",
                "1. Are there any factual errors or hallucinations?",
                "2. Did you reference files or code that might not exist?",
                "3. Are there any assumptions that should be verified?",
                "",
                "Last response to evaluate:",
                lastAssistantMessage.content.slice(0, 2000),
            ].join("\n")

            try {
                const response = await deps.llm.chat([
                    { role: "user", content: evalPrompt, timestamp: Date.now() },
                ])

                return {
                    success: true,
                    message: `Self-evaluation:\n${response.content}`,
                    data: { evaluated: lastAssistantMessage.content.slice(0, 100) },
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err)
                return { success: false, message: `Evaluation failed: ${errorMessage}` }
            }
        },
    }
}

function createAutoApplyCommand(
    actions: UseCommandsActions,
    options: UseCommandsOptions,
): CommandDefinition {
    return {
        name: "auto-apply",
        description: "Toggle auto-apply mode (on/off)",
        usage: "/auto-apply [on|off]",
        execute: async (args: string[]): Promise<CommandResult> => {
            const arg = args[0]?.toLowerCase()

            if (arg === "on") {
                actions.setAutoApply(true)
                return Promise.resolve({ success: true, message: "Auto-apply enabled." })
            }

            if (arg === "off") {
                actions.setAutoApply(false)
                return Promise.resolve({ success: true, message: "Auto-apply disabled." })
            }

            if (!arg) {
                const current = options.autoApply ? "on" : "off"
                return Promise.resolve({
                    success: true,
                    message: `Auto-apply is currently: ${current}`,
                })
            }

            return Promise.resolve({ success: false, message: "Usage: /auto-apply [on|off]" })
        },
    }
}

/**
 * Hook for handling slash commands in TUI.
 */
export function useCommands(
    deps: UseCommandsDependencies,
    actions: UseCommandsActions,
    options: UseCommandsOptions,
): UseCommandsReturn {
    const commands = useMemo((): Map<string, CommandDefinition> => {
        const map = new Map<string, CommandDefinition>()

        // Register all commands
        const helpCmd = createHelpCommand(map)
        map.set("help", helpCmd)
        map.set("clear", createClearCommand(actions))
        map.set("undo", createUndoCommand(deps, actions))
        map.set("sessions", createSessionsCommand(deps))
        map.set("status", createStatusCommand(deps, options))
        map.set("reindex", createReindexCommand(actions))
        map.set("eval", createEvalCommand(deps))
        map.set("auto-apply", createAutoApplyCommand(actions, options))

        return map
    }, [deps, actions, options])

    const isCommand = useCallback((input: string): boolean => {
        return input.trim().startsWith("/")
    }, [])

    const executeCommand = useCallback(
        async (input: string): Promise<CommandResult | null> => {
            const parsed = parseCommand(input)
            if (!parsed) {
                return null
            }

            const command = commands.get(parsed.command)
            if (!command) {
                const available = Array.from(commands.keys()).join(", ")
                return {
                    success: false,
                    message: `Unknown command: /${parsed.command}\nAvailable: ${available}`,
                }
            }

            return command.execute(parsed.args)
        },
        [commands],
    )

    const getCommands = useCallback((): CommandDefinition[] => {
        return Array.from(commands.values())
    }, [commands])

    return {
        executeCommand,
        isCommand,
        getCommands,
    }
}
