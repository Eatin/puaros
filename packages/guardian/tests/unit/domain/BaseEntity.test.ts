import { describe, it, expect } from "vitest"
import { BaseEntity } from "../../../src/domain/entities/BaseEntity"

class TestEntity extends BaseEntity {
    constructor(id?: string) {
        super(id)
    }
}

describe("BaseEntity", () => {
    it("should create an entity with generated id", () => {
        const entity = new TestEntity()
        expect(entity.id).toBeDefined()
        expect(typeof entity.id).toBe("string")
    })

    it("should create an entity with provided id", () => {
        const customId = "custom-id-123"
        const entity = new TestEntity(customId)
        expect(entity.id).toBe(customId)
    })

    it("should have createdAt and updatedAt timestamps", () => {
        const entity = new TestEntity()
        expect(entity.createdAt).toBeInstanceOf(Date)
        expect(entity.updatedAt).toBeInstanceOf(Date)
    })

    it("should return true when comparing same entity", () => {
        const entity = new TestEntity()
        expect(entity.equals(entity)).toBe(true)
    })

    it("should return true when comparing entities with same id", () => {
        const id = "same-id"
        const entity1 = new TestEntity(id)
        const entity2 = new TestEntity(id)
        expect(entity1.equals(entity2)).toBe(true)
    })

    it("should return false when comparing entities with different ids", () => {
        const entity1 = new TestEntity()
        const entity2 = new TestEntity()
        expect(entity1.equals(entity2)).toBe(false)
    })
})
