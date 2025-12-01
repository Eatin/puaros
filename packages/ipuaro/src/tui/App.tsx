/**
 * Main TUI App component.
 * Orchestrates the terminal user interface.
 */

import { Box, Text, useApp } from "ink"
import React, { useCallback, useEffect, useState } from "react"
import type { ILLMClient } from "../domain/services/ILLMClient.js"
import type { ISessionStorage } from "../domain/services/ISessionStorage.js"
import type { IStorage } from "../domain/services/IStorage.js"
import type { DiffInfo } from "../domain/services/ITool.js"
import type { ErrorChoice } from "../shared/types/index.js"
import type { IToolRegistry } from "../application/interfaces/IToolRegistry.js"
import type { ProjectStructure } from "../infrastructure/llm/prompts.js"
import { Chat, Input, StatusBar } from "./components/index.js"
import { useHotkeys, useSession } from "./hooks/index.js"
import type { AppProps, BranchInfo } from "./types.js"

export interface AppDependencies {
    storage: IStorage
    sessionStorage: ISessionStorage
    llm: ILLMClient
    tools: IToolRegistry
    projectStructure?: ProjectStructure
}

export interface ExtendedAppProps extends AppProps {
    deps: AppDependencies
    onExit?: () => void
}

function LoadingScreen(): React.JSX.Element {
    return (
        <Box flexDirection="column" padding={1}>
            <Text color="cyan">Loading session...</Text>
        </Box>
    )
}

function ErrorScreen({ error }: { error: Error }): React.JSX.Element {
    return (
        <Box flexDirection="column" padding={1}>
            <Text color="red" bold>
                Error
            </Text>
            <Text color="red">{error.message}</Text>
        </Box>
    )
}

async function handleConfirmationDefault(_message: string, _diff?: DiffInfo): Promise<boolean> {
    return Promise.resolve(true)
}

async function handleErrorDefault(_error: Error): Promise<ErrorChoice> {
    return Promise.resolve("skip")
}

export function App({
    projectPath,
    autoApply = false,
    deps,
    onExit,
}: ExtendedAppProps): React.JSX.Element {
    const { exit } = useApp()

    const [branch] = useState<BranchInfo>({ name: "main", isDetached: false })
    const [sessionTime, setSessionTime] = useState("0m")

    const projectName = projectPath.split("/").pop() ?? "unknown"

    const { session, messages, status, isLoading, error, sendMessage, undo, abort } = useSession(
        {
            storage: deps.storage,
            sessionStorage: deps.sessionStorage,
            llm: deps.llm,
            tools: deps.tools,
            projectRoot: projectPath,
            projectName,
            projectStructure: deps.projectStructure,
        },
        {
            autoApply,
            onConfirmation: handleConfirmationDefault,
            onError: handleErrorDefault,
        },
    )

    const handleExit = useCallback((): void => {
        onExit?.()
        exit()
    }, [exit, onExit])

    const handleInterrupt = useCallback((): void => {
        if (status === "thinking" || status === "tool_call") {
            abort()
        }
    }, [status, abort])

    const handleUndo = useCallback((): void => {
        void undo()
    }, [undo])

    useHotkeys(
        {
            onInterrupt: handleInterrupt,
            onExit: handleExit,
            onUndo: handleUndo,
        },
        { enabled: !isLoading },
    )

    useEffect(() => {
        if (!session) {
            return
        }

        const interval = setInterval(() => {
            setSessionTime(session.getSessionDurationFormatted())
        }, 60_000)

        setSessionTime(session.getSessionDurationFormatted())

        return (): void => {
            clearInterval(interval)
        }
    }, [session])

    const handleSubmit = useCallback(
        (text: string): void => {
            if (text.startsWith("/")) {
                return
            }
            void sendMessage(text)
        },
        [sendMessage],
    )

    if (isLoading) {
        return <LoadingScreen />
    }

    if (error) {
        return <ErrorScreen error={error} />
    }

    const isInputDisabled = status === "thinking" || status === "tool_call"

    return (
        <Box flexDirection="column" height="100%">
            <StatusBar
                contextUsage={session?.context.tokenUsage ?? 0}
                projectName={projectName}
                branch={branch}
                sessionTime={sessionTime}
                status={status}
            />
            <Chat messages={messages} isThinking={status === "thinking"} />
            <Input
                onSubmit={handleSubmit}
                history={session?.inputHistory ?? []}
                disabled={isInputDisabled}
                placeholder={isInputDisabled ? "Processing..." : "Type a message..."}
            />
        </Box>
    )
}
