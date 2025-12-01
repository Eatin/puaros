/**
 * Tests for DisplayConfigSchema.
 */

import { describe, expect, it } from "vitest"
import { DisplayConfigSchema } from "../../../src/shared/constants/config.js"

describe("DisplayConfigSchema", () => {
    describe("default values", () => {
        it("should use defaults when empty object provided", () => {
            const result = DisplayConfigSchema.parse({})

            expect(result).toEqual({
                showStats: true,
                showToolCalls: true,
                theme: "dark",
                bellOnComplete: false,
                progressBar: true,
            })
        })

        it("should use defaults via .default({})", () => {
            const result = DisplayConfigSchema.default({}).parse({})

            expect(result).toEqual({
                showStats: true,
                showToolCalls: true,
                theme: "dark",
                bellOnComplete: false,
                progressBar: true,
            })
        })
    })

    describe("showStats", () => {
        it("should accept true", () => {
            const result = DisplayConfigSchema.parse({ showStats: true })
            expect(result.showStats).toBe(true)
        })

        it("should accept false", () => {
            const result = DisplayConfigSchema.parse({ showStats: false })
            expect(result.showStats).toBe(false)
        })

        it("should reject non-boolean", () => {
            expect(() => DisplayConfigSchema.parse({ showStats: "yes" })).toThrow()
        })
    })

    describe("showToolCalls", () => {
        it("should accept true", () => {
            const result = DisplayConfigSchema.parse({ showToolCalls: true })
            expect(result.showToolCalls).toBe(true)
        })

        it("should accept false", () => {
            const result = DisplayConfigSchema.parse({ showToolCalls: false })
            expect(result.showToolCalls).toBe(false)
        })

        it("should reject non-boolean", () => {
            expect(() => DisplayConfigSchema.parse({ showToolCalls: "yes" })).toThrow()
        })
    })

    describe("theme", () => {
        it("should accept dark", () => {
            const result = DisplayConfigSchema.parse({ theme: "dark" })
            expect(result.theme).toBe("dark")
        })

        it("should accept light", () => {
            const result = DisplayConfigSchema.parse({ theme: "light" })
            expect(result.theme).toBe("light")
        })

        it("should reject invalid theme", () => {
            expect(() => DisplayConfigSchema.parse({ theme: "blue" })).toThrow()
        })

        it("should reject non-string", () => {
            expect(() => DisplayConfigSchema.parse({ theme: 123 })).toThrow()
        })
    })

    describe("bellOnComplete", () => {
        it("should accept true", () => {
            const result = DisplayConfigSchema.parse({ bellOnComplete: true })
            expect(result.bellOnComplete).toBe(true)
        })

        it("should accept false", () => {
            const result = DisplayConfigSchema.parse({ bellOnComplete: false })
            expect(result.bellOnComplete).toBe(false)
        })

        it("should reject non-boolean", () => {
            expect(() => DisplayConfigSchema.parse({ bellOnComplete: "yes" })).toThrow()
        })
    })

    describe("progressBar", () => {
        it("should accept true", () => {
            const result = DisplayConfigSchema.parse({ progressBar: true })
            expect(result.progressBar).toBe(true)
        })

        it("should accept false", () => {
            const result = DisplayConfigSchema.parse({ progressBar: false })
            expect(result.progressBar).toBe(false)
        })

        it("should reject non-boolean", () => {
            expect(() => DisplayConfigSchema.parse({ progressBar: "yes" })).toThrow()
        })
    })

    describe("partial config", () => {
        it("should merge partial config with defaults", () => {
            const result = DisplayConfigSchema.parse({
                theme: "light",
                bellOnComplete: true,
            })

            expect(result).toEqual({
                showStats: true,
                showToolCalls: true,
                theme: "light",
                bellOnComplete: true,
                progressBar: true,
            })
        })
    })

    describe("full config", () => {
        it("should accept valid full config", () => {
            const config = {
                showStats: false,
                showToolCalls: false,
                theme: "light" as const,
                bellOnComplete: true,
                progressBar: false,
            }

            const result = DisplayConfigSchema.parse(config)
            expect(result).toEqual(config)
        })
    })
})
