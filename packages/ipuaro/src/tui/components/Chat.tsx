/**
 * Chat component for TUI.
 * Displays message history with tool calls and stats.
 */

import { Box, Text } from "ink"
import type React from "react"
import type { ChatMessage } from "../../domain/value-objects/ChatMessage.js"
import type { ToolCall } from "../../domain/value-objects/ToolCall.js"

export interface ChatProps {
    messages: ChatMessage[]
    isThinking: boolean
}

function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp)
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
}

function formatStats(stats: ChatMessage["stats"]): string {
    if (!stats) {
        return ""
    }
    const time = (stats.timeMs / 1000).toFixed(1)
    const tokens = stats.tokens.toLocaleString()
    const tools = stats.toolCalls

    const parts = [`${time}s`, `${tokens} tokens`]
    if (tools > 0) {
        parts.push(`${String(tools)} tool${tools > 1 ? "s" : ""}`)
    }
    return parts.join(" | ")
}

function formatToolCall(call: ToolCall): string {
    const params = Object.entries(call.params)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(" ")
    return `[${call.name} ${params}]`
}

function UserMessage({ message }: { message: ChatMessage }): React.JSX.Element {
    return (
        <Box flexDirection="column" marginBottom={1}>
            <Box gap={1}>
                <Text color="green" bold>
                    You
                </Text>
                <Text color="gray" dimColor>
                    {formatTimestamp(message.timestamp)}
                </Text>
            </Box>
            <Box marginLeft={2}>
                <Text>{message.content}</Text>
            </Box>
        </Box>
    )
}

function AssistantMessage({ message }: { message: ChatMessage }): React.JSX.Element {
    const stats = formatStats(message.stats)

    return (
        <Box flexDirection="column" marginBottom={1}>
            <Box gap={1}>
                <Text color="cyan" bold>
                    Assistant
                </Text>
                <Text color="gray" dimColor>
                    {formatTimestamp(message.timestamp)}
                </Text>
            </Box>

            {message.toolCalls && message.toolCalls.length > 0 && (
                <Box flexDirection="column" marginLeft={2} marginBottom={1}>
                    {message.toolCalls.map((call) => (
                        <Text key={call.id} color="yellow">
                            {formatToolCall(call)}
                        </Text>
                    ))}
                </Box>
            )}

            {message.content && (
                <Box marginLeft={2}>
                    <Text>{message.content}</Text>
                </Box>
            )}

            {stats && (
                <Box marginLeft={2} marginTop={1}>
                    <Text color="gray" dimColor>
                        {stats}
                    </Text>
                </Box>
            )}
        </Box>
    )
}

function ToolMessage({ message }: { message: ChatMessage }): React.JSX.Element {
    return (
        <Box flexDirection="column" marginBottom={1} marginLeft={2}>
            {message.toolResults?.map((result) => (
                <Box key={result.callId} flexDirection="column">
                    <Text color={result.success ? "green" : "red"}>
                        {result.success ? "+" : "x"} {result.callId.slice(0, 8)}
                    </Text>
                </Box>
            ))}
        </Box>
    )
}

function SystemMessage({ message }: { message: ChatMessage }): React.JSX.Element {
    const isError = message.content.toLowerCase().startsWith("error")

    return (
        <Box marginBottom={1} marginLeft={2}>
            <Text color={isError ? "red" : "gray"} dimColor={!isError}>
                {message.content}
            </Text>
        </Box>
    )
}

function MessageComponent({ message }: { message: ChatMessage }): React.JSX.Element {
    switch (message.role) {
        case "user": {
            return <UserMessage message={message} />
        }
        case "assistant": {
            return <AssistantMessage message={message} />
        }
        case "tool": {
            return <ToolMessage message={message} />
        }
        case "system": {
            return <SystemMessage message={message} />
        }
        default: {
            return <></>
        }
    }
}

function ThinkingIndicator(): React.JSX.Element {
    return (
        <Box marginBottom={1}>
            <Text color="yellow">Thinking...</Text>
        </Box>
    )
}

export function Chat({ messages, isThinking }: ChatProps): React.JSX.Element {
    return (
        <Box flexDirection="column" flexGrow={1} paddingX={1}>
            {messages.map((message, index) => (
                <MessageComponent
                    key={`${String(message.timestamp)}-${String(index)}`}
                    message={message}
                />
            ))}
            {isThinking && <ThinkingIndicator />}
        </Box>
    )
}
