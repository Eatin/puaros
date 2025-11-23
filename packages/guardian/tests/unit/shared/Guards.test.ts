import { describe, it, expect } from "vitest"
import { Guards } from "../../../src/shared/utils/Guards"

describe("Guards", () => {
    describe("isNullOrUndefined", () => {
        it("should return true for null", () => {
            expect(Guards.isNullOrUndefined(null)).toBe(true)
        })

        it("should return true for undefined", () => {
            expect(Guards.isNullOrUndefined(undefined)).toBe(true)
        })

        it("should return false for other values", () => {
            expect(Guards.isNullOrUndefined(0)).toBe(false)
            expect(Guards.isNullOrUndefined("")).toBe(false)
            expect(Guards.isNullOrUndefined(false)).toBe(false)
        })
    })

    describe("isString", () => {
        it("should return true for strings", () => {
            expect(Guards.isString("hello")).toBe(true)
            expect(Guards.isString("")).toBe(true)
        })

        it("should return false for non-strings", () => {
            expect(Guards.isString(123)).toBe(false)
            expect(Guards.isString(null)).toBe(false)
        })
    })

    describe("isEmpty", () => {
        it("should return true for empty strings", () => {
            expect(Guards.isEmpty("")).toBe(true)
        })

        it("should return true for empty arrays", () => {
            expect(Guards.isEmpty([])).toBe(true)
        })

        it("should return true for empty objects", () => {
            expect(Guards.isEmpty({})).toBe(true)
        })

        it("should return true for null/undefined", () => {
            expect(Guards.isEmpty(null)).toBe(true)
            expect(Guards.isEmpty(undefined)).toBe(true)
        })

        it("should return false for non-empty values", () => {
            expect(Guards.isEmpty("text")).toBe(false)
            expect(Guards.isEmpty([1])).toBe(false)
            expect(Guards.isEmpty({ key: "value" })).toBe(false)
        })
    })
})
