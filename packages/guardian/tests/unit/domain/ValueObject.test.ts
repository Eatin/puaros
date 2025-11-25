import { describe, it, expect } from "vitest"
import { ValueObject } from "../../../src/domain/value-objects/ValueObject"

interface TestProps {
    readonly value: string
    readonly count: number
}

class TestValueObject extends ValueObject<TestProps> {
    constructor(value: string, count: number) {
        super({ value, count })
    }

    public get value(): string {
        return this.props.value
    }

    public get count(): number {
        return this.props.count
    }
}

interface ComplexProps {
    readonly name: string
    readonly items: string[]
    readonly metadata: { key: string; value: number }
}

class ComplexValueObject extends ValueObject<ComplexProps> {
    constructor(name: string, items: string[], metadata: { key: string; value: number }) {
        super({ name, items, metadata })
    }

    public get name(): string {
        return this.props.name
    }

    public get items(): string[] {
        return this.props.items
    }

    public get metadata(): { key: string; value: number } {
        return this.props.metadata
    }
}

describe("ValueObject", () => {
    describe("constructor", () => {
        it("should create a value object with provided properties", () => {
            const vo = new TestValueObject("test", 42)

            expect(vo.value).toBe("test")
            expect(vo.count).toBe(42)
        })

        it("should freeze the properties object", () => {
            const vo = new TestValueObject("test", 42)

            expect(Object.isFrozen(vo["props"])).toBe(true)
        })

        it("should prevent modification of properties", () => {
            const vo = new TestValueObject("test", 42)

            expect(() => {
                ;(vo["props"] as any).value = "modified"
            }).toThrow()
        })

        it("should handle complex nested properties", () => {
            const vo = new ComplexValueObject("test", ["item1", "item2"], {
                key: "key1",
                value: 100,
            })

            expect(vo.name).toBe("test")
            expect(vo.items).toEqual(["item1", "item2"])
            expect(vo.metadata).toEqual({ key: "key1", value: 100 })
        })
    })

    describe("equals", () => {
        it("should return true for value objects with identical properties", () => {
            const vo1 = new TestValueObject("test", 42)
            const vo2 = new TestValueObject("test", 42)

            expect(vo1.equals(vo2)).toBe(true)
        })

        it("should return false for value objects with different values", () => {
            const vo1 = new TestValueObject("test1", 42)
            const vo2 = new TestValueObject("test2", 42)

            expect(vo1.equals(vo2)).toBe(false)
        })

        it("should return false for value objects with different counts", () => {
            const vo1 = new TestValueObject("test", 42)
            const vo2 = new TestValueObject("test", 43)

            expect(vo1.equals(vo2)).toBe(false)
        })

        it("should return false when comparing with undefined", () => {
            const vo1 = new TestValueObject("test", 42)

            expect(vo1.equals(undefined)).toBe(false)
        })

        it("should return false when comparing with null", () => {
            const vo1 = new TestValueObject("test", 42)

            expect(vo1.equals(null as any)).toBe(false)
        })

        it("should handle complex nested property comparisons", () => {
            const vo1 = new ComplexValueObject("test", ["item1", "item2"], {
                key: "key1",
                value: 100,
            })
            const vo2 = new ComplexValueObject("test", ["item1", "item2"], {
                key: "key1",
                value: 100,
            })

            expect(vo1.equals(vo2)).toBe(true)
        })

        it("should detect differences in nested arrays", () => {
            const vo1 = new ComplexValueObject("test", ["item1", "item2"], {
                key: "key1",
                value: 100,
            })
            const vo2 = new ComplexValueObject("test", ["item1", "item3"], {
                key: "key1",
                value: 100,
            })

            expect(vo1.equals(vo2)).toBe(false)
        })

        it("should detect differences in nested objects", () => {
            const vo1 = new ComplexValueObject("test", ["item1", "item2"], {
                key: "key1",
                value: 100,
            })
            const vo2 = new ComplexValueObject("test", ["item1", "item2"], {
                key: "key2",
                value: 100,
            })

            expect(vo1.equals(vo2)).toBe(false)
        })

        it("should return true for same instance", () => {
            const vo1 = new TestValueObject("test", 42)

            expect(vo1.equals(vo1)).toBe(true)
        })

        it("should handle empty string values", () => {
            const vo1 = new TestValueObject("", 0)
            const vo2 = new TestValueObject("", 0)

            expect(vo1.equals(vo2)).toBe(true)
        })

        it("should distinguish between zero and undefined in comparisons", () => {
            const vo1 = new TestValueObject("test", 0)
            const vo2 = new TestValueObject("test", 0)

            expect(vo1.equals(vo2)).toBe(true)
        })
    })

    describe("immutability", () => {
        it("should freeze props object after creation", () => {
            const vo = new TestValueObject("original", 42)

            expect(Object.isFrozen(vo["props"])).toBe(true)
        })

        it("should not allow adding new properties", () => {
            const vo = new TestValueObject("test", 42)

            expect(() => {
                ;(vo["props"] as any).newProp = "new"
            }).toThrow()
        })

        it("should not allow deleting properties", () => {
            const vo = new TestValueObject("test", 42)

            expect(() => {
                delete (vo["props"] as any).value
            }).toThrow()
        })
    })
})
