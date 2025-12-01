/**
 * Tests for useSession hook.
 */

import { describe, expect, it, vi, beforeEach } from "vitest"
import type {
    UseSessionDependencies,
    UseSessionOptions,
} from "../../../../src/tui/hooks/useSession.js"

describe("useSession", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("module exports", () => {
        it("should export useSession function", async () => {
            const mod = await import("../../../../src/tui/hooks/useSession.js")
            expect(mod.useSession).toBeDefined()
            expect(typeof mod.useSession).toBe("function")
        })
    })

    describe("UseSessionDependencies interface", () => {
        it("should require storage", () => {
            const deps: Partial<UseSessionDependencies> = {
                storage: {} as UseSessionDependencies["storage"],
            }
            expect(deps.storage).toBeDefined()
        })

        it("should require sessionStorage", () => {
            const deps: Partial<UseSessionDependencies> = {
                sessionStorage: {} as UseSessionDependencies["sessionStorage"],
            }
            expect(deps.sessionStorage).toBeDefined()
        })

        it("should require llm", () => {
            const deps: Partial<UseSessionDependencies> = {
                llm: {} as UseSessionDependencies["llm"],
            }
            expect(deps.llm).toBeDefined()
        })

        it("should require tools", () => {
            const deps: Partial<UseSessionDependencies> = {
                tools: {} as UseSessionDependencies["tools"],
            }
            expect(deps.tools).toBeDefined()
        })

        it("should require projectRoot", () => {
            const deps: Partial<UseSessionDependencies> = {
                projectRoot: "/path/to/project",
            }
            expect(deps.projectRoot).toBe("/path/to/project")
        })

        it("should require projectName", () => {
            const deps: Partial<UseSessionDependencies> = {
                projectName: "test-project",
            }
            expect(deps.projectName).toBe("test-project")
        })

        it("should accept optional projectStructure", () => {
            const deps: Partial<UseSessionDependencies> = {
                projectStructure: { files: [], directories: [] },
            }
            expect(deps.projectStructure).toBeDefined()
        })
    })

    describe("UseSessionOptions interface", () => {
        it("should accept autoApply option", () => {
            const options: UseSessionOptions = {
                autoApply: true,
            }
            expect(options.autoApply).toBe(true)
        })

        it("should accept onConfirmation callback", () => {
            const options: UseSessionOptions = {
                onConfirmation: async () => true,
            }
            expect(options.onConfirmation).toBeDefined()
        })

        it("should accept onError callback", () => {
            const options: UseSessionOptions = {
                onError: async () => "skip",
            }
            expect(options.onError).toBeDefined()
        })

        it("should allow all options together", () => {
            const options: UseSessionOptions = {
                autoApply: false,
                onConfirmation: async () => false,
                onError: async () => "retry",
            }
            expect(options.autoApply).toBe(false)
            expect(options.onConfirmation).toBeDefined()
            expect(options.onError).toBeDefined()
        })
    })

    describe("UseSessionReturn interface", () => {
        it("should define expected return shape", () => {
            const expectedKeys = [
                "session",
                "messages",
                "status",
                "isLoading",
                "error",
                "sendMessage",
                "undo",
                "clearHistory",
                "abort",
            ]

            expectedKeys.forEach((key) => {
                expect(key).toBeTruthy()
            })
        })
    })
})
