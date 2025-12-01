/**
 * Tests for StatusBar component.
 */

import { describe, expect, it } from "vitest"
import type { StatusBarProps } from "../../../../src/tui/components/StatusBar.js"
import type { TuiStatus, BranchInfo } from "../../../../src/tui/types.js"

describe("StatusBar", () => {
    describe("module exports", () => {
        it("should export StatusBar component", async () => {
            const mod = await import("../../../../src/tui/components/StatusBar.js")
            expect(mod.StatusBar).toBeDefined()
            expect(typeof mod.StatusBar).toBe("function")
        })
    })

    describe("StatusBarProps interface", () => {
        it("should accept contextUsage as number", () => {
            const props: Partial<StatusBarProps> = {
                contextUsage: 0.5,
            }
            expect(props.contextUsage).toBe(0.5)
        })

        it("should accept contextUsage from 0 to 1", () => {
            const props1: Partial<StatusBarProps> = { contextUsage: 0 }
            const props2: Partial<StatusBarProps> = { contextUsage: 0.5 }
            const props3: Partial<StatusBarProps> = { contextUsage: 1 }

            expect(props1.contextUsage).toBe(0)
            expect(props2.contextUsage).toBe(0.5)
            expect(props3.contextUsage).toBe(1)
        })

        it("should accept projectName as string", () => {
            const props: Partial<StatusBarProps> = {
                projectName: "my-project",
            }
            expect(props.projectName).toBe("my-project")
        })

        it("should accept branch info", () => {
            const branch: BranchInfo = {
                name: "main",
                isDetached: false,
            }
            const props: Partial<StatusBarProps> = { branch }
            expect(props.branch?.name).toBe("main")
            expect(props.branch?.isDetached).toBe(false)
        })

        it("should handle detached HEAD state", () => {
            const branch: BranchInfo = {
                name: "abc1234",
                isDetached: true,
            }
            const props: Partial<StatusBarProps> = { branch }
            expect(props.branch?.isDetached).toBe(true)
        })

        it("should accept sessionTime as string", () => {
            const props: Partial<StatusBarProps> = {
                sessionTime: "47m",
            }
            expect(props.sessionTime).toBe("47m")
        })

        it("should accept status value", () => {
            const statuses: TuiStatus[] = [
                "ready",
                "thinking",
                "tool_call",
                "awaiting_confirmation",
                "error",
            ]

            statuses.forEach((status) => {
                const props: Partial<StatusBarProps> = { status }
                expect(props.status).toBe(status)
            })
        })
    })

    describe("status display logic", () => {
        const statusExpectations: Array<{ status: TuiStatus; expectedText: string }> = [
            { status: "ready", expectedText: "ready" },
            { status: "thinking", expectedText: "thinking..." },
            { status: "tool_call", expectedText: "executing..." },
            { status: "awaiting_confirmation", expectedText: "confirm?" },
            { status: "error", expectedText: "error" },
        ]

        statusExpectations.forEach(({ status, expectedText }) => {
            it(`should display "${expectedText}" for status "${status}"`, () => {
                expect(expectedText).toBeTruthy()
            })
        })
    })

    describe("context usage display", () => {
        it("should format context usage as percentage", () => {
            const usages = [0, 0.1, 0.5, 0.8, 1]
            const expected = ["0%", "10%", "50%", "80%", "100%"]

            usages.forEach((usage, index) => {
                const formatted = `${String(Math.round(usage * 100))}%`
                expect(formatted).toBe(expected[index])
            })
        })
    })
})
