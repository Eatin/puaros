import { describe, it, expect } from "vitest"
import { HardcodedValue } from "../../../src/domain/value-objects/HardcodedValue"
import { HARDCODE_TYPES } from "../../../src/shared/constants"

describe("HardcodedValue", () => {
    describe("create", () => {
        it("should create a magic number value", () => {
            const value = HardcodedValue.create(
                5000,
                HARDCODE_TYPES.MAGIC_NUMBER,
                10,
                20,
                "setTimeout(() => {}, 5000)",
            )

            expect(value.value).toBe(5000)
            expect(value.type).toBe(HARDCODE_TYPES.MAGIC_NUMBER)
            expect(value.line).toBe(10)
            expect(value.column).toBe(20)
            expect(value.context).toBe("setTimeout(() => {}, 5000)")
        })

        it("should create a magic string value", () => {
            const value = HardcodedValue.create(
                "http://localhost:8080",
                HARDCODE_TYPES.MAGIC_STRING,
                5,
                15,
                'const url = "http://localhost:8080"',
            )

            expect(value.value).toBe("http://localhost:8080")
            expect(value.type).toBe(HARDCODE_TYPES.MAGIC_STRING)
        })
    })

    describe("isMagicNumber", () => {
        it("should return true for magic numbers", () => {
            const value = HardcodedValue.create(
                3000,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "timeout = 3000",
            )

            expect(value.isMagicNumber()).toBe(true)
        })

        it("should return false for magic strings", () => {
            const value = HardcodedValue.create(
                "some string",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                "const str = 'some string'",
            )

            expect(value.isMagicNumber()).toBe(false)
        })
    })

    describe("isMagicString", () => {
        it("should return true for magic strings", () => {
            const value = HardcodedValue.create(
                "http://localhost",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'url = "http://localhost"',
            )

            expect(value.isMagicString()).toBe(true)
        })

        it("should return false for magic numbers", () => {
            const value = HardcodedValue.create(
                8080,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "port = 8080",
            )

            expect(value.isMagicString()).toBe(false)
        })
    })

    describe("suggestConstantName for numbers", () => {
        it("should suggest TIMEOUT_MS for timeout context", () => {
            const value = HardcodedValue.create(
                5000,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "const timeout = 5000",
            )

            expect(value.suggestConstantName()).toBe("TIMEOUT_MS")
        })

        it("should suggest MAX_RETRIES for retry context", () => {
            const value = HardcodedValue.create(
                3,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "const retry = 3",
            )

            expect(value.suggestConstantName()).toBe("MAX_RETRIES")
        })

        it("should suggest MAX_RETRIES for attempts context", () => {
            const value = HardcodedValue.create(
                5,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "const attempts = 5",
            )

            expect(value.suggestConstantName()).toBe("MAX_RETRIES")
        })

        it("should suggest MAX_LIMIT for limit context", () => {
            const value = HardcodedValue.create(
                100,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "const limit = 100",
            )

            expect(value.suggestConstantName()).toBe("MAX_LIMIT")
        })

        it("should suggest MAX_LIMIT for max context", () => {
            const value = HardcodedValue.create(
                50,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "const max = 50",
            )

            expect(value.suggestConstantName()).toBe("MAX_LIMIT")
        })

        it("should suggest DEFAULT_PORT for port context", () => {
            const value = HardcodedValue.create(
                8080,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "const port = 8080",
            )

            expect(value.suggestConstantName()).toBe("DEFAULT_PORT")
        })

        it("should suggest DELAY_MS for delay context", () => {
            const value = HardcodedValue.create(
                1000,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "const delay = 1000",
            )

            expect(value.suggestConstantName()).toBe("DELAY_MS")
        })

        it("should suggest MAGIC_NUMBER_<value> for unknown context", () => {
            const value = HardcodedValue.create(
                999,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "const x = 999",
            )

            expect(value.suggestConstantName()).toBe("MAGIC_NUMBER_999")
        })
    })

    describe("suggestConstantName for strings", () => {
        it("should suggest API_BASE_URL for http URLs", () => {
            const value = HardcodedValue.create(
                "http://localhost:3000",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'const url = "http://localhost:3000"',
            )

            expect(value.suggestConstantName()).toBe("API_BASE_URL")
        })

        it("should suggest API_BASE_URL for https URLs", () => {
            const value = HardcodedValue.create(
                "https://api.example.com",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'const url = "https://api.example.com"',
            )

            expect(value.suggestConstantName()).toBe("API_BASE_URL")
        })

        it("should suggest DEFAULT_DOMAIN for domain-like strings", () => {
            const value = HardcodedValue.create(
                "example.com",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'const domain = "example.com"',
            )

            expect(value.suggestConstantName()).toBe("DEFAULT_DOMAIN")
        })

        it("should suggest DEFAULT_PATH for path-like strings", () => {
            const value = HardcodedValue.create(
                "api.example.com/users",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'const path = "api.example.com/users"',
            )

            expect(value.suggestConstantName()).toBe("DEFAULT_PATH")
        })

        it("should suggest ERROR_MESSAGE for error context", () => {
            const value = HardcodedValue.create(
                "Something went wrong",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'const error = "Something went wrong"',
            )

            expect(value.suggestConstantName()).toBe("ERROR_MESSAGE")
        })

        it("should suggest ERROR_MESSAGE for message context", () => {
            const value = HardcodedValue.create(
                "Invalid input",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'const message = "Invalid input"',
            )

            expect(value.suggestConstantName()).toBe("ERROR_MESSAGE")
        })

        it("should suggest DEFAULT_VALUE for default context", () => {
            const value = HardcodedValue.create(
                "default value",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'const default = "default value"',
            )

            expect(value.suggestConstantName()).toBe("DEFAULT_VALUE")
        })

        it("should suggest MAGIC_STRING for unknown context", () => {
            const value = HardcodedValue.create(
                "some random string",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'const x = "some random string"',
            )

            expect(value.suggestConstantName()).toBe("MAGIC_STRING")
        })
    })

    describe("suggestLocation", () => {
        it("should suggest shared/constants when no layer specified", () => {
            const value = HardcodedValue.create(
                5000,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "timeout = 5000",
            )

            expect(value.suggestLocation()).toBe("shared/constants")
        })

        it("should suggest shared/constants for general values", () => {
            const value = HardcodedValue.create(
                8080,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "port = 8080",
            )

            expect(value.suggestLocation("infrastructure")).toBe("shared/constants")
        })

        it("should suggest layer/constants for domain context", () => {
            const value = HardcodedValue.create(
                100,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "entity limit = 100",
            )

            expect(value.suggestLocation("domain")).toBe("domain/constants")
        })

        it("should suggest layer/constants for aggregate context", () => {
            const value = HardcodedValue.create(
                50,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "aggregate max = 50",
            )

            expect(value.suggestLocation("domain")).toBe("domain/constants")
        })

        it("should suggest infrastructure/config for config context", () => {
            const value = HardcodedValue.create(
                3000,
                HARDCODE_TYPES.MAGIC_NUMBER,
                1,
                1,
                "config timeout = 3000",
            )

            expect(value.suggestLocation("infrastructure")).toBe("infrastructure/config")
        })

        it("should suggest infrastructure/config for env context", () => {
            const value = HardcodedValue.create(
                "production",
                HARDCODE_TYPES.MAGIC_STRING,
                1,
                1,
                'env mode = "production"',
            )

            expect(value.suggestLocation("infrastructure")).toBe("infrastructure/config")
        })
    })
})
