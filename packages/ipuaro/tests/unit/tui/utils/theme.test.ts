/**
 * Tests for theme utilities.
 */

import { describe, expect, it } from "vitest"
import { getColorScheme, getContextColor, getRoleColor, getStatusColor } from "../../../../src/tui/utils/theme.js"

describe("theme utilities", () => {
    describe("getColorScheme", () => {
        it("should return dark theme colors for dark", () => {
            const scheme = getColorScheme("dark")

            expect(scheme).toEqual({
                primary: "cyan",
                secondary: "blue",
                success: "green",
                warning: "yellow",
                error: "red",
                info: "cyan",
                muted: "gray",
                background: "black",
                foreground: "white",
            })
        })

        it("should return light theme colors for light", () => {
            const scheme = getColorScheme("light")

            expect(scheme).toEqual({
                primary: "blue",
                secondary: "cyan",
                success: "green",
                warning: "yellow",
                error: "red",
                info: "blue",
                muted: "gray",
                background: "white",
                foreground: "black",
            })
        })
    })

    describe("getStatusColor", () => {
        it("should return success color for ready status", () => {
            const color = getStatusColor("ready", "dark")
            expect(color).toBe("green")
        })

        it("should return warning color for thinking status", () => {
            const color = getStatusColor("thinking", "dark")
            expect(color).toBe("yellow")
        })

        it("should return warning color for tool_call status", () => {
            const color = getStatusColor("tool_call", "dark")
            expect(color).toBe("yellow")
        })

        it("should return info color for awaiting_confirmation status", () => {
            const color = getStatusColor("awaiting_confirmation", "dark")
            expect(color).toBe("cyan")
        })

        it("should return error color for error status", () => {
            const color = getStatusColor("error", "dark")
            expect(color).toBe("red")
        })

        it("should use light theme colors when theme is light", () => {
            const color = getStatusColor("awaiting_confirmation", "light")
            expect(color).toBe("blue")
        })

        it("should use dark theme by default", () => {
            const color = getStatusColor("ready")
            expect(color).toBe("green")
        })
    })

    describe("getRoleColor", () => {
        it("should return success color for user role", () => {
            const color = getRoleColor("user", "dark")
            expect(color).toBe("green")
        })

        it("should return primary color for assistant role", () => {
            const color = getRoleColor("assistant", "dark")
            expect(color).toBe("cyan")
        })

        it("should return muted color for system role", () => {
            const color = getRoleColor("system", "dark")
            expect(color).toBe("gray")
        })

        it("should return secondary color for tool role", () => {
            const color = getRoleColor("tool", "dark")
            expect(color).toBe("blue")
        })

        it("should use light theme colors when theme is light", () => {
            const color = getRoleColor("assistant", "light")
            expect(color).toBe("blue")
        })

        it("should use dark theme by default", () => {
            const color = getRoleColor("user")
            expect(color).toBe("green")
        })
    })

    describe("getContextColor", () => {
        it("should return success color for low usage", () => {
            const color = getContextColor(0.5, "dark")
            expect(color).toBe("green")
        })

        it("should return warning color for medium usage", () => {
            const color = getContextColor(0.7, "dark")
            expect(color).toBe("yellow")
        })

        it("should return error color for high usage", () => {
            const color = getContextColor(0.9, "dark")
            expect(color).toBe("red")
        })

        it("should return success color at 59% usage", () => {
            const color = getContextColor(0.59, "dark")
            expect(color).toBe("green")
        })

        it("should return warning color at 60% usage", () => {
            const color = getContextColor(0.6, "dark")
            expect(color).toBe("yellow")
        })

        it("should return warning color at 79% usage", () => {
            const color = getContextColor(0.79, "dark")
            expect(color).toBe("yellow")
        })

        it("should return error color at 80% usage", () => {
            const color = getContextColor(0.8, "dark")
            expect(color).toBe("red")
        })

        it("should use light theme colors when theme is light", () => {
            const color = getContextColor(0.7, "light")
            expect(color).toBe("yellow")
        })

        it("should use dark theme by default", () => {
            const color = getContextColor(0.5)
            expect(color).toBe("green")
        })
    })
})
