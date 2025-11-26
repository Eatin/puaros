import { describe, it, expect } from "vitest"
import { EntityExposure } from "../../../src/domain/value-objects/EntityExposure"

describe("EntityExposure", () => {
    describe("create", () => {
        it("should create entity exposure with all properties", () => {
            const exposure = EntityExposure.create(
                "User",
                "User",
                "src/controllers/UserController.ts",
                "infrastructure",
                25,
                "getUser",
            )

            expect(exposure.entityName).toBe("User")
            expect(exposure.returnType).toBe("User")
            expect(exposure.filePath).toBe("src/controllers/UserController.ts")
            expect(exposure.layer).toBe("infrastructure")
            expect(exposure.line).toBe(25)
            expect(exposure.methodName).toBe("getUser")
        })

        it("should create entity exposure without optional properties", () => {
            const exposure = EntityExposure.create(
                "Order",
                "Order",
                "src/controllers/OrderController.ts",
                "infrastructure",
            )

            expect(exposure.entityName).toBe("Order")
            expect(exposure.line).toBeUndefined()
            expect(exposure.methodName).toBeUndefined()
        })

        it("should create entity exposure with line but without method name", () => {
            const exposure = EntityExposure.create(
                "Product",
                "Product",
                "src/api/ProductApi.ts",
                "infrastructure",
                15,
            )

            expect(exposure.line).toBe(15)
            expect(exposure.methodName).toBeUndefined()
        })
    })

    describe("getMessage", () => {
        it("should return message with method name", () => {
            const exposure = EntityExposure.create(
                "User",
                "User",
                "src/controllers/UserController.ts",
                "infrastructure",
                25,
                "getUser",
            )

            const message = exposure.getMessage()

            expect(message).toContain("Method 'getUser'")
            expect(message).toContain("returns domain entity 'User'")
            expect(message).toContain("instead of DTO")
        })

        it("should return message without method name", () => {
            const exposure = EntityExposure.create(
                "Order",
                "Order",
                "src/controllers/OrderController.ts",
                "infrastructure",
                30,
            )

            const message = exposure.getMessage()

            expect(message).toContain("returns domain entity 'Order'")
            expect(message).toContain("instead of DTO")
            expect(message).not.toContain("undefined")
        })

        it("should handle different entity names", () => {
            const exposures = [
                EntityExposure.create(
                    "Customer",
                    "Customer",
                    "file.ts",
                    "infrastructure",
                    1,
                    "getCustomer",
                ),
                EntityExposure.create(
                    "Invoice",
                    "Invoice",
                    "file.ts",
                    "infrastructure",
                    2,
                    "findInvoice",
                ),
                EntityExposure.create(
                    "Payment",
                    "Payment",
                    "file.ts",
                    "infrastructure",
                    3,
                    "processPayment",
                ),
            ]

            exposures.forEach((exposure) => {
                const message = exposure.getMessage()
                expect(message).toContain(exposure.entityName)
                expect(message).toContain("instead of DTO")
            })
        })
    })

    describe("getSuggestion", () => {
        it("should return multi-line suggestion", () => {
            const exposure = EntityExposure.create(
                "User",
                "User",
                "src/controllers/UserController.ts",
                "infrastructure",
                25,
                "getUser",
            )

            const suggestion = exposure.getSuggestion()

            expect(suggestion).toContain("Create a DTO class")
            expect(suggestion).toContain("UserResponseDto")
            expect(suggestion).toContain("Create a mapper")
            expect(suggestion).toContain("Update the method")
        })

        it("should suggest appropriate DTO name based on entity", () => {
            const exposure = EntityExposure.create(
                "Order",
                "Order",
                "src/controllers/OrderController.ts",
                "infrastructure",
            )

            const suggestion = exposure.getSuggestion()

            expect(suggestion).toContain("OrderResponseDto")
            expect(suggestion).toContain("convert Order to OrderResponseDto")
        })

        it("should provide step-by-step suggestions", () => {
            const exposure = EntityExposure.create(
                "Product",
                "Product",
                "src/api/ProductApi.ts",
                "infrastructure",
                10,
            )

            const suggestion = exposure.getSuggestion()
            const lines = suggestion.split("\n")

            expect(lines.length).toBeGreaterThan(1)
            expect(lines.some((line) => line.includes("Create a DTO"))).toBe(true)
            expect(lines.some((line) => line.includes("mapper"))).toBe(true)
            expect(lines.some((line) => line.includes("Update the method"))).toBe(true)
        })
    })

    describe("getExampleFix", () => {
        it("should return example with method name", () => {
            const exposure = EntityExposure.create(
                "User",
                "User",
                "src/controllers/UserController.ts",
                "infrastructure",
                25,
                "getUser",
            )

            const example = exposure.getExampleFix()

            expect(example).toContain("Bad: Exposing domain entity")
            expect(example).toContain("Good: Using DTO")
            expect(example).toContain("getUser()")
            expect(example).toContain("Promise<User>")
            expect(example).toContain("Promise<UserResponseDto>")
            expect(example).toContain("UserMapper.toDto")
        })

        it("should return example without method name", () => {
            const exposure = EntityExposure.create(
                "Order",
                "Order",
                "src/controllers/OrderController.ts",
                "infrastructure",
                30,
            )

            const example = exposure.getExampleFix()

            expect(example).toContain("Promise<Order>")
            expect(example).toContain("Promise<OrderResponseDto>")
            expect(example).toContain("OrderMapper.toDto")
            expect(example).not.toContain("undefined")
        })

        it("should show both bad and good examples", () => {
            const exposure = EntityExposure.create(
                "Product",
                "Product",
                "src/api/ProductApi.ts",
                "infrastructure",
                15,
                "findProduct",
            )

            const example = exposure.getExampleFix()

            expect(example).toContain("❌ Bad")
            expect(example).toContain("✅ Good")
        })

        it("should include async/await pattern", () => {
            const exposure = EntityExposure.create(
                "Customer",
                "Customer",
                "src/api/CustomerApi.ts",
                "infrastructure",
                20,
                "getCustomer",
            )

            const example = exposure.getExampleFix()

            expect(example).toContain("async")
            expect(example).toContain("await")
        })
    })

    describe("value object behavior", () => {
        it("should be equal to another instance with same values", () => {
            const exposure1 = EntityExposure.create(
                "User",
                "User",
                "file.ts",
                "infrastructure",
                10,
                "getUser",
            )
            const exposure2 = EntityExposure.create(
                "User",
                "User",
                "file.ts",
                "infrastructure",
                10,
                "getUser",
            )

            expect(exposure1.equals(exposure2)).toBe(true)
        })

        it("should not be equal to instance with different values", () => {
            const exposure1 = EntityExposure.create(
                "User",
                "User",
                "file.ts",
                "infrastructure",
                10,
                "getUser",
            )
            const exposure2 = EntityExposure.create(
                "Order",
                "Order",
                "file.ts",
                "infrastructure",
                10,
                "getUser",
            )

            expect(exposure1.equals(exposure2)).toBe(false)
        })

        it("should not be equal to instance with different method name", () => {
            const exposure1 = EntityExposure.create(
                "User",
                "User",
                "file.ts",
                "infrastructure",
                10,
                "getUser",
            )
            const exposure2 = EntityExposure.create(
                "User",
                "User",
                "file.ts",
                "infrastructure",
                10,
                "findUser",
            )

            expect(exposure1.equals(exposure2)).toBe(false)
        })
    })

    describe("edge cases", () => {
        it("should handle empty entity name", () => {
            const exposure = EntityExposure.create("", "", "file.ts", "infrastructure")

            expect(exposure.entityName).toBe("")
            expect(exposure.getMessage()).toBeTruthy()
        })

        it("should handle very long entity names", () => {
            const longName = "VeryLongEntityNameThatIsUnusuallyLong"
            const exposure = EntityExposure.create(longName, longName, "file.ts", "infrastructure")

            expect(exposure.entityName).toBe(longName)
            const suggestion = exposure.getSuggestion()
            expect(suggestion).toContain(`${longName}ResponseDto`)
        })

        it("should handle special characters in method name", () => {
            const exposure = EntityExposure.create(
                "User",
                "User",
                "file.ts",
                "infrastructure",
                10,
                "get$User",
            )

            const message = exposure.getMessage()
            expect(message).toContain("get$User")
        })

        it("should handle line number 0", () => {
            const exposure = EntityExposure.create("User", "User", "file.ts", "infrastructure", 0)

            expect(exposure.line).toBe(0)
        })

        it("should handle very large line numbers", () => {
            const exposure = EntityExposure.create(
                "User",
                "User",
                "file.ts",
                "infrastructure",
                999999,
            )

            expect(exposure.line).toBe(999999)
        })
    })
})
