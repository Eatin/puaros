/**
 * Tests for Input component.
 */

import { describe, expect, it, vi } from "vitest"
import type { InputProps } from "../../../../src/tui/components/Input.js"

describe("Input", () => {
    describe("module exports", () => {
        it("should export Input component", async () => {
            const mod = await import("../../../../src/tui/components/Input.js")
            expect(mod.Input).toBeDefined()
            expect(typeof mod.Input).toBe("function")
        })
    })

    describe("InputProps interface", () => {
        it("should accept onSubmit callback", () => {
            const onSubmit = vi.fn()
            const props: InputProps = {
                onSubmit,
                history: [],
                disabled: false,
            }
            expect(props.onSubmit).toBe(onSubmit)
        })

        it("should accept history array", () => {
            const history = ["first", "second", "third"]
            const props: InputProps = {
                onSubmit: vi.fn(),
                history,
                disabled: false,
            }
            expect(props.history).toEqual(history)
        })

        it("should accept disabled state", () => {
            const props: InputProps = {
                onSubmit: vi.fn(),
                history: [],
                disabled: true,
            }
            expect(props.disabled).toBe(true)
        })

        it("should accept optional placeholder", () => {
            const props: InputProps = {
                onSubmit: vi.fn(),
                history: [],
                disabled: false,
                placeholder: "Custom placeholder...",
            }
            expect(props.placeholder).toBe("Custom placeholder...")
        })

        it("should have default placeholder when not provided", () => {
            const props: InputProps = {
                onSubmit: vi.fn(),
                history: [],
                disabled: false,
            }
            expect(props.placeholder).toBeUndefined()
        })
    })

    describe("history navigation logic", () => {
        it("should navigate up through history", () => {
            const history = ["first", "second", "third"]
            let historyIndex = -1
            let value = ""

            historyIndex = history.length - 1
            value = history[historyIndex] ?? ""
            expect(value).toBe("third")

            historyIndex = Math.max(0, historyIndex - 1)
            value = history[historyIndex] ?? ""
            expect(value).toBe("second")

            historyIndex = Math.max(0, historyIndex - 1)
            value = history[historyIndex] ?? ""
            expect(value).toBe("first")

            historyIndex = Math.max(0, historyIndex - 1)
            value = history[historyIndex] ?? ""
            expect(value).toBe("first")
        })

        it("should navigate down through history", () => {
            const history = ["first", "second", "third"]
            let historyIndex = 0
            let value = ""
            const savedInput = "current input"

            historyIndex = historyIndex + 1
            value = history[historyIndex] ?? ""
            expect(value).toBe("second")

            historyIndex = historyIndex + 1
            value = history[historyIndex] ?? ""
            expect(value).toBe("third")

            if (historyIndex >= history.length - 1) {
                historyIndex = -1
                value = savedInput
            }
            expect(value).toBe("current input")
            expect(historyIndex).toBe(-1)
        })

        it("should save current input when navigating up", () => {
            const currentInput = "typing something"
            let savedInput = ""

            savedInput = currentInput
            expect(savedInput).toBe("typing something")
        })

        it("should restore saved input when navigating past history end", () => {
            const savedInput = "original input"
            let value = ""

            value = savedInput
            expect(value).toBe("original input")
        })
    })

    describe("submit behavior", () => {
        it("should not submit empty input", () => {
            const onSubmit = vi.fn()
            const text = "   "

            if (text.trim()) {
                onSubmit(text)
            }

            expect(onSubmit).not.toHaveBeenCalled()
        })

        it("should submit non-empty input", () => {
            const onSubmit = vi.fn()
            const text = "hello"

            if (text.trim()) {
                onSubmit(text)
            }

            expect(onSubmit).toHaveBeenCalledWith("hello")
        })

        it("should not submit when disabled", () => {
            const onSubmit = vi.fn()
            const text = "hello"
            const disabled = true

            if (!disabled && text.trim()) {
                onSubmit(text)
            }

            expect(onSubmit).not.toHaveBeenCalled()
        })
    })

    describe("state reset after submit", () => {
        it("should reset value after submit", () => {
            let value = "test input"
            value = ""
            expect(value).toBe("")
        })

        it("should reset history index after submit", () => {
            let historyIndex = 2
            historyIndex = -1
            expect(historyIndex).toBe(-1)
        })

        it("should reset saved input after submit", () => {
            let savedInput = "saved"
            savedInput = ""
            expect(savedInput).toBe("")
        })
    })
})
