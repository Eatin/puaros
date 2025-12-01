/**
 * Tests for TUI types.
 */

import { describe, expect, it } from "vitest"
import type { TuiStatus, BranchInfo, AppProps, StatusBarData } from "../../../src/tui/types.js"

describe("TUI types", () => {
    describe("TuiStatus type", () => {
        it("should include ready status", () => {
            const status: TuiStatus = "ready"
            expect(status).toBe("ready")
        })

        it("should include thinking status", () => {
            const status: TuiStatus = "thinking"
            expect(status).toBe("thinking")
        })

        it("should include tool_call status", () => {
            const status: TuiStatus = "tool_call"
            expect(status).toBe("tool_call")
        })

        it("should include awaiting_confirmation status", () => {
            const status: TuiStatus = "awaiting_confirmation"
            expect(status).toBe("awaiting_confirmation")
        })

        it("should include error status", () => {
            const status: TuiStatus = "error"
            expect(status).toBe("error")
        })
    })

    describe("BranchInfo interface", () => {
        it("should have name property", () => {
            const branch: BranchInfo = {
                name: "main",
                isDetached: false,
            }
            expect(branch.name).toBe("main")
        })

        it("should have isDetached property", () => {
            const branch: BranchInfo = {
                name: "abc1234",
                isDetached: true,
            }
            expect(branch.isDetached).toBe(true)
        })

        it("should represent normal branch", () => {
            const branch: BranchInfo = {
                name: "feature/new-feature",
                isDetached: false,
            }
            expect(branch.name).toBe("feature/new-feature")
            expect(branch.isDetached).toBe(false)
        })

        it("should represent detached HEAD", () => {
            const branch: BranchInfo = {
                name: "abc1234def5678",
                isDetached: true,
            }
            expect(branch.isDetached).toBe(true)
        })
    })

    describe("AppProps interface", () => {
        it("should require projectPath", () => {
            const props: AppProps = {
                projectPath: "/path/to/project",
            }
            expect(props.projectPath).toBe("/path/to/project")
        })

        it("should accept optional autoApply", () => {
            const props: AppProps = {
                projectPath: "/path/to/project",
                autoApply: true,
            }
            expect(props.autoApply).toBe(true)
        })

        it("should accept optional model", () => {
            const props: AppProps = {
                projectPath: "/path/to/project",
                model: "qwen2.5-coder:7b-instruct",
            }
            expect(props.model).toBe("qwen2.5-coder:7b-instruct")
        })

        it("should accept all optional props together", () => {
            const props: AppProps = {
                projectPath: "/path/to/project",
                autoApply: false,
                model: "custom-model",
            }
            expect(props.projectPath).toBe("/path/to/project")
            expect(props.autoApply).toBe(false)
            expect(props.model).toBe("custom-model")
        })
    })

    describe("StatusBarData interface", () => {
        it("should have contextUsage as number", () => {
            const data: StatusBarData = {
                contextUsage: 0.5,
                projectName: "test",
                branch: { name: "main", isDetached: false },
                sessionTime: "10m",
                status: "ready",
            }
            expect(data.contextUsage).toBe(0.5)
        })

        it("should have projectName as string", () => {
            const data: StatusBarData = {
                contextUsage: 0,
                projectName: "my-project",
                branch: { name: "main", isDetached: false },
                sessionTime: "0m",
                status: "ready",
            }
            expect(data.projectName).toBe("my-project")
        })

        it("should have branch as BranchInfo", () => {
            const data: StatusBarData = {
                contextUsage: 0,
                projectName: "test",
                branch: { name: "develop", isDetached: false },
                sessionTime: "0m",
                status: "ready",
            }
            expect(data.branch.name).toBe("develop")
            expect(data.branch.isDetached).toBe(false)
        })

        it("should have sessionTime as string", () => {
            const data: StatusBarData = {
                contextUsage: 0,
                projectName: "test",
                branch: { name: "main", isDetached: false },
                sessionTime: "1h 30m",
                status: "ready",
            }
            expect(data.sessionTime).toBe("1h 30m")
        })

        it("should have status as TuiStatus", () => {
            const data: StatusBarData = {
                contextUsage: 0,
                projectName: "test",
                branch: { name: "main", isDetached: false },
                sessionTime: "0m",
                status: "thinking",
            }
            expect(data.status).toBe("thinking")
        })
    })

    describe("module exports", () => {
        it("should export all types", async () => {
            const mod = await import("../../../src/tui/types.js")
            expect(mod).toBeDefined()
        })
    })
})
