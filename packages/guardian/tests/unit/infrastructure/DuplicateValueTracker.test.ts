import { describe, it, expect, beforeEach } from "vitest"
import { DuplicateValueTracker } from "../../../src/infrastructure/analyzers/DuplicateValueTracker"
import { HardcodedValue } from "../../../src/domain/value-objects/HardcodedValue"

describe("DuplicateValueTracker", () => {
    let tracker: DuplicateValueTracker

    beforeEach(() => {
        tracker = new DuplicateValueTracker()
    })

    describe("track", () => {
        it("should track a single hardcoded value", () => {
            const value = HardcodedValue.create(
                "test-value",
                "magic-string",
                10,
                5,
                "const x = 'test-value'",
            )

            tracker.track(value, "file1.ts")

            const duplicates = tracker.getDuplicates()
            expect(duplicates).toHaveLength(0)
        })

        it("should track multiple occurrences of the same value", () => {
            const value1 = HardcodedValue.create(
                "test-value",
                "magic-string",
                10,
                5,
                "const x = 'test-value'",
            )
            const value2 = HardcodedValue.create(
                "test-value",
                "magic-string",
                20,
                5,
                "const y = 'test-value'",
            )

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            const duplicates = tracker.getDuplicates()
            expect(duplicates).toHaveLength(1)
            expect(duplicates[0].value).toBe("test-value")
            expect(duplicates[0].count).toBe(2)
        })

        it("should track values with different types separately", () => {
            const stringValue = HardcodedValue.create(
                "100",
                "magic-string",
                10,
                5,
                "const x = '100'",
            )
            const numberValue = HardcodedValue.create(100, "magic-number", 20, 5, "const y = 100")

            tracker.track(stringValue, "file1.ts")
            tracker.track(numberValue, "file2.ts")

            const duplicates = tracker.getDuplicates()
            expect(duplicates).toHaveLength(0)
        })

        it("should track boolean values", () => {
            const value1 = HardcodedValue.create(true, "MAGIC_BOOLEAN", 10, 5, "const x = true")
            const value2 = HardcodedValue.create(true, "MAGIC_BOOLEAN", 20, 5, "const y = true")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            const duplicates = tracker.getDuplicates()
            expect(duplicates).toHaveLength(1)
            expect(duplicates[0].value).toBe("true")
        })
    })

    describe("getDuplicates", () => {
        it("should return empty array when no duplicates exist", () => {
            const value1 = HardcodedValue.create(
                "value1",
                "magic-string",
                10,
                5,
                "const x = 'value1'",
            )
            const value2 = HardcodedValue.create(
                "value2",
                "magic-string",
                20,
                5,
                "const y = 'value2'",
            )

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            const duplicates = tracker.getDuplicates()
            expect(duplicates).toHaveLength(0)
        })

        it("should return duplicates sorted by count in descending order", () => {
            const value1a = HardcodedValue.create(
                "value1",
                "magic-string",
                10,
                5,
                "const x = 'value1'",
            )
            const value1b = HardcodedValue.create(
                "value1",
                "magic-string",
                20,
                5,
                "const y = 'value1'",
            )
            const value2a = HardcodedValue.create(
                "value2",
                "magic-string",
                30,
                5,
                "const z = 'value2'",
            )
            const value2b = HardcodedValue.create(
                "value2",
                "magic-string",
                40,
                5,
                "const a = 'value2'",
            )
            const value2c = HardcodedValue.create(
                "value2",
                "magic-string",
                50,
                5,
                "const b = 'value2'",
            )

            tracker.track(value1a, "file1.ts")
            tracker.track(value1b, "file2.ts")
            tracker.track(value2a, "file3.ts")
            tracker.track(value2b, "file4.ts")
            tracker.track(value2c, "file5.ts")

            const duplicates = tracker.getDuplicates()
            expect(duplicates).toHaveLength(2)
            expect(duplicates[0].value).toBe("value2")
            expect(duplicates[0].count).toBe(3)
            expect(duplicates[1].value).toBe("value1")
            expect(duplicates[1].count).toBe(2)
        })

        it("should include location information for duplicates", () => {
            const value1 = HardcodedValue.create("test", "magic-string", 10, 5, "const x = 'test'")
            const value2 = HardcodedValue.create("test", "magic-string", 20, 10, "const y = 'test'")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            const duplicates = tracker.getDuplicates()
            expect(duplicates[0].locations).toHaveLength(2)
            expect(duplicates[0].locations[0]).toEqual({
                file: "file1.ts",
                line: 10,
                context: "const x = 'test'",
            })
            expect(duplicates[0].locations[1]).toEqual({
                file: "file2.ts",
                line: 20,
                context: "const y = 'test'",
            })
        })
    })

    describe("getDuplicateLocations", () => {
        it("should return null when value is not duplicated", () => {
            const value = HardcodedValue.create("test", "magic-string", 10, 5, "const x = 'test'")

            tracker.track(value, "file1.ts")

            const locations = tracker.getDuplicateLocations("test", "magic-string")
            expect(locations).toBeNull()
        })

        it("should return locations when value is duplicated", () => {
            const value1 = HardcodedValue.create("test", "magic-string", 10, 5, "const x = 'test'")
            const value2 = HardcodedValue.create("test", "magic-string", 20, 10, "const y = 'test'")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            const locations = tracker.getDuplicateLocations("test", "magic-string")
            expect(locations).toHaveLength(2)
            expect(locations).toEqual([
                { file: "file1.ts", line: 10, context: "const x = 'test'" },
                { file: "file2.ts", line: 20, context: "const y = 'test'" },
            ])
        })

        it("should return null for non-existent value", () => {
            const locations = tracker.getDuplicateLocations("non-existent", "magic-string")
            expect(locations).toBeNull()
        })

        it("should handle numeric values", () => {
            const value1 = HardcodedValue.create(100, "magic-number", 10, 5, "const x = 100")
            const value2 = HardcodedValue.create(100, "magic-number", 20, 5, "const y = 100")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            const locations = tracker.getDuplicateLocations(100, "magic-number")
            expect(locations).toHaveLength(2)
        })
    })

    describe("isDuplicate", () => {
        it("should return false for non-duplicated value", () => {
            const value = HardcodedValue.create("test", "magic-string", 10, 5, "const x = 'test'")

            tracker.track(value, "file1.ts")

            expect(tracker.isDuplicate("test", "magic-string")).toBe(false)
        })

        it("should return true for duplicated value", () => {
            const value1 = HardcodedValue.create("test", "magic-string", 10, 5, "const x = 'test'")
            const value2 = HardcodedValue.create("test", "magic-string", 20, 10, "const y = 'test'")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            expect(tracker.isDuplicate("test", "magic-string")).toBe(true)
        })

        it("should return false for non-existent value", () => {
            expect(tracker.isDuplicate("non-existent", "magic-string")).toBe(false)
        })

        it("should handle boolean values", () => {
            const value1 = HardcodedValue.create(true, "MAGIC_BOOLEAN", 10, 5, "const x = true")
            const value2 = HardcodedValue.create(true, "MAGIC_BOOLEAN", 20, 5, "const y = true")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            expect(tracker.isDuplicate(true, "MAGIC_BOOLEAN")).toBe(true)
        })
    })

    describe("getStats", () => {
        it("should return zero stats for empty tracker", () => {
            const stats = tracker.getStats()

            expect(stats.totalValues).toBe(0)
            expect(stats.duplicateValues).toBe(0)
            expect(stats.duplicatePercentage).toBe(0)
        })

        it("should calculate stats correctly with no duplicates", () => {
            const value1 = HardcodedValue.create(
                "value1",
                "magic-string",
                10,
                5,
                "const x = 'value1'",
            )
            const value2 = HardcodedValue.create(
                "value2",
                "magic-string",
                20,
                5,
                "const y = 'value2'",
            )

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            const stats = tracker.getStats()
            expect(stats.totalValues).toBe(2)
            expect(stats.duplicateValues).toBe(0)
            expect(stats.duplicatePercentage).toBe(0)
        })

        it("should calculate stats correctly with duplicates", () => {
            const value1a = HardcodedValue.create(
                "value1",
                "magic-string",
                10,
                5,
                "const x = 'value1'",
            )
            const value1b = HardcodedValue.create(
                "value1",
                "magic-string",
                20,
                5,
                "const y = 'value1'",
            )
            const value2 = HardcodedValue.create(
                "value2",
                "magic-string",
                30,
                5,
                "const z = 'value2'",
            )

            tracker.track(value1a, "file1.ts")
            tracker.track(value1b, "file2.ts")
            tracker.track(value2, "file3.ts")

            const stats = tracker.getStats()
            expect(stats.totalValues).toBe(2)
            expect(stats.duplicateValues).toBe(1)
            expect(stats.duplicatePercentage).toBe(50)
        })

        it("should handle multiple duplicates", () => {
            const value1a = HardcodedValue.create(
                "value1",
                "magic-string",
                10,
                5,
                "const x = 'value1'",
            )
            const value1b = HardcodedValue.create(
                "value1",
                "magic-string",
                20,
                5,
                "const y = 'value1'",
            )
            const value2a = HardcodedValue.create(
                "value2",
                "magic-string",
                30,
                5,
                "const z = 'value2'",
            )
            const value2b = HardcodedValue.create(
                "value2",
                "magic-string",
                40,
                5,
                "const a = 'value2'",
            )

            tracker.track(value1a, "file1.ts")
            tracker.track(value1b, "file2.ts")
            tracker.track(value2a, "file3.ts")
            tracker.track(value2b, "file4.ts")

            const stats = tracker.getStats()
            expect(stats.totalValues).toBe(2)
            expect(stats.duplicateValues).toBe(2)
            expect(stats.duplicatePercentage).toBe(100)
        })
    })

    describe("clear", () => {
        it("should clear all tracked values", () => {
            const value1 = HardcodedValue.create("test", "magic-string", 10, 5, "const x = 'test'")
            const value2 = HardcodedValue.create("test", "magic-string", 20, 10, "const y = 'test'")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            expect(tracker.getDuplicates()).toHaveLength(1)

            tracker.clear()

            expect(tracker.getDuplicates()).toHaveLength(0)
            expect(tracker.getStats().totalValues).toBe(0)
        })

        it("should allow tracking new values after clear", () => {
            const value1 = HardcodedValue.create(
                "test1",
                "magic-string",
                10,
                5,
                "const x = 'test1'",
            )

            tracker.track(value1, "file1.ts")
            tracker.clear()

            const value2 = HardcodedValue.create(
                "test2",
                "magic-string",
                20,
                5,
                "const y = 'test2'",
            )
            tracker.track(value2, "file2.ts")

            const stats = tracker.getStats()
            expect(stats.totalValues).toBe(1)
        })
    })

    describe("edge cases", () => {
        it("should handle values with colons in them", () => {
            const value1 = HardcodedValue.create(
                "url:http://example.com",
                "magic-string",
                10,
                5,
                "const x = 'url:http://example.com'",
            )
            const value2 = HardcodedValue.create(
                "url:http://example.com",
                "magic-string",
                20,
                5,
                "const y = 'url:http://example.com'",
            )

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            const duplicates = tracker.getDuplicates()
            expect(duplicates).toHaveLength(1)
            expect(duplicates[0].value).toBe("url:http://example.com")
        })

        it("should handle empty string values", () => {
            const value1 = HardcodedValue.create("", "magic-string", 10, 5, "const x = ''")
            const value2 = HardcodedValue.create("", "magic-string", 20, 5, "const y = ''")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            expect(tracker.isDuplicate("", "magic-string")).toBe(true)
        })

        it("should handle zero as a number", () => {
            const value1 = HardcodedValue.create(0, "magic-number", 10, 5, "const x = 0")
            const value2 = HardcodedValue.create(0, "magic-number", 20, 5, "const y = 0")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file2.ts")

            expect(tracker.isDuplicate(0, "magic-number")).toBe(true)
        })

        it("should track same file multiple times", () => {
            const value1 = HardcodedValue.create("test", "magic-string", 10, 5, "const x = 'test'")
            const value2 = HardcodedValue.create("test", "magic-string", 20, 5, "const y = 'test'")

            tracker.track(value1, "file1.ts")
            tracker.track(value2, "file1.ts")

            const locations = tracker.getDuplicateLocations("test", "magic-string")
            expect(locations).toHaveLength(2)
            expect(locations?.[0].file).toBe("file1.ts")
            expect(locations?.[1].file).toBe("file1.ts")
        })
    })
})
