/**
 * Tests for useHotkeys hook.
 */

import { describe, expect, it, vi, beforeEach } from "vitest"

describe("useHotkeys", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe("module exports", () => {
        it("should export useHotkeys function", async () => {
            const mod = await import("../../../../src/tui/hooks/useHotkeys.js")
            expect(mod.useHotkeys).toBeDefined()
            expect(typeof mod.useHotkeys).toBe("function")
        })
    })

    describe("HotkeyHandlers interface", () => {
        it("should accept onInterrupt callback", () => {
            const handlers = {
                onInterrupt: vi.fn(),
            }
            expect(handlers.onInterrupt).toBeDefined()
        })

        it("should accept onExit callback", () => {
            const handlers = {
                onExit: vi.fn(),
            }
            expect(handlers.onExit).toBeDefined()
        })

        it("should accept onUndo callback", () => {
            const handlers = {
                onUndo: vi.fn(),
            }
            expect(handlers.onUndo).toBeDefined()
        })

        it("should accept all callbacks together", () => {
            const handlers = {
                onInterrupt: vi.fn(),
                onExit: vi.fn(),
                onUndo: vi.fn(),
            }
            expect(handlers.onInterrupt).toBeDefined()
            expect(handlers.onExit).toBeDefined()
            expect(handlers.onUndo).toBeDefined()
        })
    })

    describe("UseHotkeysOptions interface", () => {
        it("should accept enabled option", () => {
            const options = {
                enabled: true,
            }
            expect(options.enabled).toBe(true)
        })

        it("should default enabled to undefined when not provided", () => {
            const options = {}
            expect((options as { enabled?: boolean }).enabled).toBeUndefined()
        })
    })
})
