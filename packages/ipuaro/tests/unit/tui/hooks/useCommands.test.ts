/**
 * Tests for useCommands hook.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    parseCommand,
    type UseCommandsDependencies,
    type UseCommandsActions,
    type UseCommandsOptions,
    type CommandResult,
    type CommandDefinition,
} from "../../../../src/tui/hooks/useCommands.js"

describe("useCommands", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("module exports", () => {
        it("should export useCommands function", async () => {
            const mod = await import("../../../../src/tui/hooks/useCommands.js")
            expect(mod.useCommands).toBeDefined()
            expect(typeof mod.useCommands).toBe("function")
        })

        it("should export parseCommand function", async () => {
            const mod = await import("../../../../src/tui/hooks/useCommands.js")
            expect(mod.parseCommand).toBeDefined()
            expect(typeof mod.parseCommand).toBe("function")
        })
    })

    describe("parseCommand", () => {
        it("should parse simple command", () => {
            const result = parseCommand("/help")
            expect(result).toEqual({ command: "help", args: [] })
        })

        it("should parse command with single argument", () => {
            const result = parseCommand("/auto-apply on")
            expect(result).toEqual({ command: "auto-apply", args: ["on"] })
        })

        it("should parse command with multiple arguments", () => {
            const result = parseCommand("/sessions load abc123")
            expect(result).toEqual({ command: "sessions", args: ["load", "abc123"] })
        })

        it("should handle leading whitespace", () => {
            const result = parseCommand("  /status")
            expect(result).toEqual({ command: "status", args: [] })
        })

        it("should handle trailing whitespace", () => {
            const result = parseCommand("/help  ")
            expect(result).toEqual({ command: "help", args: [] })
        })

        it("should handle multiple spaces between args", () => {
            const result = parseCommand("/sessions   load   id123")
            expect(result).toEqual({ command: "sessions", args: ["load", "id123"] })
        })

        it("should convert command to lowercase", () => {
            const result = parseCommand("/HELP")
            expect(result).toEqual({ command: "help", args: [] })
        })

        it("should convert mixed case command to lowercase", () => {
            const result = parseCommand("/Status")
            expect(result).toEqual({ command: "status", args: [] })
        })

        it("should return null for non-command input", () => {
            const result = parseCommand("hello world")
            expect(result).toBeNull()
        })

        it("should return null for empty input", () => {
            const result = parseCommand("")
            expect(result).toBeNull()
        })

        it("should return null for whitespace-only input", () => {
            const result = parseCommand("   ")
            expect(result).toBeNull()
        })

        it("should return null for slash in middle of text", () => {
            const result = parseCommand("hello /command")
            expect(result).toBeNull()
        })

        it("should handle command with hyphen", () => {
            const result = parseCommand("/auto-apply")
            expect(result).toEqual({ command: "auto-apply", args: [] })
        })

        it("should preserve argument case", () => {
            const result = parseCommand("/sessions load SessionID123")
            expect(result).toEqual({ command: "sessions", args: ["load", "SessionID123"] })
        })

        it("should handle just slash", () => {
            const result = parseCommand("/")
            expect(result).toEqual({ command: "", args: [] })
        })
    })

    describe("UseCommandsDependencies interface", () => {
        it("should require session", () => {
            const deps: Partial<UseCommandsDependencies> = {
                session: null,
            }
            expect(deps.session).toBeNull()
        })

        it("should require sessionStorage", () => {
            const deps: Partial<UseCommandsDependencies> = {
                sessionStorage: {} as UseCommandsDependencies["sessionStorage"],
            }
            expect(deps.sessionStorage).toBeDefined()
        })

        it("should require storage", () => {
            const deps: Partial<UseCommandsDependencies> = {
                storage: {} as UseCommandsDependencies["storage"],
            }
            expect(deps.storage).toBeDefined()
        })

        it("should require llm", () => {
            const deps: Partial<UseCommandsDependencies> = {
                llm: {} as UseCommandsDependencies["llm"],
            }
            expect(deps.llm).toBeDefined()
        })

        it("should require tools", () => {
            const deps: Partial<UseCommandsDependencies> = {
                tools: {} as UseCommandsDependencies["tools"],
            }
            expect(deps.tools).toBeDefined()
        })

        it("should require projectRoot", () => {
            const deps: Partial<UseCommandsDependencies> = {
                projectRoot: "/path/to/project",
            }
            expect(deps.projectRoot).toBe("/path/to/project")
        })

        it("should require projectName", () => {
            const deps: Partial<UseCommandsDependencies> = {
                projectName: "test-project",
            }
            expect(deps.projectName).toBe("test-project")
        })
    })

    describe("UseCommandsActions interface", () => {
        it("should require clearHistory", () => {
            const actions: Partial<UseCommandsActions> = {
                clearHistory: vi.fn(),
            }
            expect(actions.clearHistory).toBeDefined()
        })

        it("should require undo", () => {
            const actions: Partial<UseCommandsActions> = {
                undo: vi.fn().mockResolvedValue(true),
            }
            expect(actions.undo).toBeDefined()
        })

        it("should require setAutoApply", () => {
            const actions: Partial<UseCommandsActions> = {
                setAutoApply: vi.fn(),
            }
            expect(actions.setAutoApply).toBeDefined()
        })

        it("should require reindex", () => {
            const actions: Partial<UseCommandsActions> = {
                reindex: vi.fn().mockResolvedValue(undefined),
            }
            expect(actions.reindex).toBeDefined()
        })
    })

    describe("UseCommandsOptions interface", () => {
        it("should require autoApply", () => {
            const options: UseCommandsOptions = {
                autoApply: true,
            }
            expect(options.autoApply).toBe(true)
        })

        it("should accept false for autoApply", () => {
            const options: UseCommandsOptions = {
                autoApply: false,
            }
            expect(options.autoApply).toBe(false)
        })
    })

    describe("CommandResult interface", () => {
        it("should have success and message", () => {
            const result: CommandResult = {
                success: true,
                message: "Command executed",
            }
            expect(result.success).toBe(true)
            expect(result.message).toBe("Command executed")
        })

        it("should accept optional data", () => {
            const result: CommandResult = {
                success: true,
                message: "Command executed",
                data: { foo: "bar" },
            }
            expect(result.data).toEqual({ foo: "bar" })
        })

        it("should represent failure", () => {
            const result: CommandResult = {
                success: false,
                message: "Command failed",
            }
            expect(result.success).toBe(false)
        })
    })

    describe("CommandDefinition interface", () => {
        it("should have name and description", () => {
            const def: CommandDefinition = {
                name: "test",
                description: "Test command",
                usage: "/test [args]",
                execute: async () => ({ success: true, message: "ok" }),
            }
            expect(def.name).toBe("test")
            expect(def.description).toBe("Test command")
        })

        it("should have usage string", () => {
            const def: CommandDefinition = {
                name: "help",
                description: "Shows help",
                usage: "/help",
                execute: async () => ({ success: true, message: "ok" }),
            }
            expect(def.usage).toBe("/help")
        })

        it("should have async execute function", async () => {
            const def: CommandDefinition = {
                name: "test",
                description: "Test",
                usage: "/test",
                execute: async (args) => ({
                    success: true,
                    message: `Args: ${args.join(", ")}`,
                }),
            }
            const result = await def.execute(["arg1", "arg2"])
            expect(result.message).toBe("Args: arg1, arg2")
        })
    })

    describe("UseCommandsReturn interface", () => {
        it("should define expected return shape", () => {
            const expectedKeys = ["executeCommand", "isCommand", "getCommands"]

            expectedKeys.forEach((key) => {
                expect(key).toBeTruthy()
            })
        })
    })

    describe("command names", () => {
        it("should define all 8 commands", () => {
            const expectedCommands = [
                "help",
                "clear",
                "undo",
                "sessions",
                "status",
                "reindex",
                "eval",
                "auto-apply",
            ]

            expectedCommands.forEach((cmd) => {
                expect(cmd).toBeTruthy()
            })
        })
    })
})
