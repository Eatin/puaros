/**
 * Tests for SessionConfigSchema.
 */

import { describe, expect, it } from "vitest"
import { SessionConfigSchema } from "../../../src/shared/constants/config.js"

describe("SessionConfigSchema", () => {
    describe("default values", () => {
        it("should use defaults when empty object provided", () => {
            const result = SessionConfigSchema.parse({})

            expect(result).toEqual({
                persistIndefinitely: true,
                maxHistoryMessages: 100,
                saveInputHistory: true,
            })
        })

        it("should use defaults via .default({})", () => {
            const result = SessionConfigSchema.default({}).parse({})

            expect(result).toEqual({
                persistIndefinitely: true,
                maxHistoryMessages: 100,
                saveInputHistory: true,
            })
        })
    })

    describe("persistIndefinitely", () => {
        it("should accept true", () => {
            const result = SessionConfigSchema.parse({ persistIndefinitely: true })
            expect(result.persistIndefinitely).toBe(true)
        })

        it("should accept false", () => {
            const result = SessionConfigSchema.parse({ persistIndefinitely: false })
            expect(result.persistIndefinitely).toBe(false)
        })

        it("should reject non-boolean", () => {
            expect(() => SessionConfigSchema.parse({ persistIndefinitely: "yes" })).toThrow()
        })
    })

    describe("maxHistoryMessages", () => {
        it("should accept valid positive integer", () => {
            const result = SessionConfigSchema.parse({ maxHistoryMessages: 50 })
            expect(result.maxHistoryMessages).toBe(50)
        })

        it("should accept default value", () => {
            const result = SessionConfigSchema.parse({ maxHistoryMessages: 100 })
            expect(result.maxHistoryMessages).toBe(100)
        })

        it("should accept large value", () => {
            const result = SessionConfigSchema.parse({ maxHistoryMessages: 1000 })
            expect(result.maxHistoryMessages).toBe(1000)
        })

        it("should reject zero", () => {
            expect(() => SessionConfigSchema.parse({ maxHistoryMessages: 0 })).toThrow()
        })

        it("should reject negative number", () => {
            expect(() => SessionConfigSchema.parse({ maxHistoryMessages: -10 })).toThrow()
        })

        it("should reject float", () => {
            expect(() => SessionConfigSchema.parse({ maxHistoryMessages: 10.5 })).toThrow()
        })

        it("should reject non-number", () => {
            expect(() => SessionConfigSchema.parse({ maxHistoryMessages: "100" })).toThrow()
        })
    })

    describe("saveInputHistory", () => {
        it("should accept true", () => {
            const result = SessionConfigSchema.parse({ saveInputHistory: true })
            expect(result.saveInputHistory).toBe(true)
        })

        it("should accept false", () => {
            const result = SessionConfigSchema.parse({ saveInputHistory: false })
            expect(result.saveInputHistory).toBe(false)
        })

        it("should reject non-boolean", () => {
            expect(() => SessionConfigSchema.parse({ saveInputHistory: "yes" })).toThrow()
        })
    })

    describe("partial config", () => {
        it("should merge partial config with defaults", () => {
            const result = SessionConfigSchema.parse({
                maxHistoryMessages: 50,
            })

            expect(result).toEqual({
                persistIndefinitely: true,
                maxHistoryMessages: 50,
                saveInputHistory: true,
            })
        })

        it("should merge multiple partial fields", () => {
            const result = SessionConfigSchema.parse({
                persistIndefinitely: false,
                saveInputHistory: false,
            })

            expect(result).toEqual({
                persistIndefinitely: false,
                maxHistoryMessages: 100,
                saveInputHistory: false,
            })
        })
    })

    describe("full config", () => {
        it("should accept valid full config", () => {
            const config = {
                persistIndefinitely: false,
                maxHistoryMessages: 200,
                saveInputHistory: false,
            }

            const result = SessionConfigSchema.parse(config)
            expect(result).toEqual(config)
        })

        it("should accept all defaults explicitly", () => {
            const config = {
                persistIndefinitely: true,
                maxHistoryMessages: 100,
                saveInputHistory: true,
            }

            const result = SessionConfigSchema.parse(config)
            expect(result).toEqual(config)
        })
    })
})
