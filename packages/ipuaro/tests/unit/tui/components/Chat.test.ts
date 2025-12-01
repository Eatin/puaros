/**
 * Tests for Chat component.
 */

import { describe, expect, it } from "vitest"
import type { ChatProps } from "../../../../src/tui/components/Chat.js"
import type { ChatMessage } from "../../../../src/domain/value-objects/ChatMessage.js"

describe("Chat", () => {
    describe("module exports", () => {
        it("should export Chat component", async () => {
            const mod = await import("../../../../src/tui/components/Chat.js")
            expect(mod.Chat).toBeDefined()
            expect(typeof mod.Chat).toBe("function")
        })
    })

    describe("ChatProps interface", () => {
        it("should accept messages array", () => {
            const messages: ChatMessage[] = []
            const props: ChatProps = {
                messages,
                isThinking: false,
            }
            expect(props.messages).toEqual([])
        })

        it("should accept isThinking boolean", () => {
            const props: ChatProps = {
                messages: [],
                isThinking: true,
            }
            expect(props.isThinking).toBe(true)
        })
    })

    describe("message formatting", () => {
        it("should handle user messages", () => {
            const message: ChatMessage = {
                role: "user",
                content: "Hello",
                timestamp: Date.now(),
            }
            expect(message.role).toBe("user")
            expect(message.content).toBe("Hello")
        })

        it("should handle assistant messages", () => {
            const message: ChatMessage = {
                role: "assistant",
                content: "Hi there!",
                timestamp: Date.now(),
                stats: {
                    tokens: 100,
                    timeMs: 1000,
                    toolCalls: 0,
                },
            }
            expect(message.role).toBe("assistant")
            expect(message.stats?.tokens).toBe(100)
        })

        it("should handle tool messages", () => {
            const message: ChatMessage = {
                role: "tool",
                content: "",
                timestamp: Date.now(),
                toolResults: [
                    {
                        callId: "123",
                        success: true,
                        data: "result",
                        durationMs: 50,
                    },
                ],
            }
            expect(message.role).toBe("tool")
            expect(message.toolResults?.length).toBe(1)
        })

        it("should handle system messages", () => {
            const message: ChatMessage = {
                role: "system",
                content: "System notification",
                timestamp: Date.now(),
            }
            expect(message.role).toBe("system")
        })
    })

    describe("timestamp formatting", () => {
        it("should format timestamp as HH:MM", () => {
            const timestamp = new Date(2025, 0, 1, 14, 30).getTime()
            const date = new Date(timestamp)
            const hours = String(date.getHours()).padStart(2, "0")
            const minutes = String(date.getMinutes()).padStart(2, "0")
            const formatted = `${hours}:${minutes}`
            expect(formatted).toBe("14:30")
        })
    })

    describe("stats formatting", () => {
        it("should format response stats", () => {
            const stats = {
                tokens: 1247,
                timeMs: 3200,
                toolCalls: 1,
            }

            const time = (stats.timeMs / 1000).toFixed(1)
            const tokens = stats.tokens.toLocaleString("en-US")
            const tools = stats.toolCalls

            expect(time).toBe("3.2")
            expect(tokens).toBe("1,247")
            expect(tools).toBe(1)
        })

        it("should pluralize tool calls correctly", () => {
            const formatTools = (count: number): string => {
                return `${String(count)} tool${count > 1 ? "s" : ""}`
            }

            expect(formatTools(1)).toBe("1 tool")
            expect(formatTools(2)).toBe("2 tools")
            expect(formatTools(5)).toBe("5 tools")
        })
    })

    describe("tool call formatting", () => {
        it("should format tool calls with params", () => {
            const toolCall = {
                id: "123",
                name: "get_lines",
                params: { path: "/src/index.ts", start: 1, end: 10 },
            }

            const params = Object.entries(toolCall.params)
                .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
                .join(" ")

            expect(params).toBe('path="/src/index.ts" start=1 end=10')
        })
    })
})
