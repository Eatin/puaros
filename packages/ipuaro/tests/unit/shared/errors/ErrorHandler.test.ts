import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    createErrorHandler,
    ErrorHandler,
    getDefaultErrorOption,
    getErrorOptions,
    isRecoverableError,
    toIpuaroError,
} from "../../../../src/shared/errors/ErrorHandler.js"
import { IpuaroError } from "../../../../src/shared/errors/IpuaroError.js"

describe("ErrorHandler", () => {
    let handler: ErrorHandler

    beforeEach(() => {
        handler = new ErrorHandler()
    })

    describe("handle", () => {
        it("should abort non-recoverable errors", async () => {
            const error = IpuaroError.redis("Connection failed")

            const result = await handler.handle(error)

            expect(result.action).toBe("abort")
            expect(result.shouldContinue).toBe(false)
        })

        it("should use default option for recoverable errors without callback", async () => {
            const error = IpuaroError.llm("Timeout")

            const result = await handler.handle(error)

            expect(result.action).toBe("retry")
            expect(result.shouldContinue).toBe(true)
        })

        it("should call onError callback when provided", async () => {
            const onError = vi.fn().mockResolvedValue("skip")
            const handler = new ErrorHandler({ onError })
            const error = IpuaroError.llm("Timeout")

            const result = await handler.handle(error)

            expect(onError).toHaveBeenCalledWith(error, error.options, error.defaultOption)
            expect(result.action).toBe("skip")
        })

        it("should auto-skip parse errors when enabled", async () => {
            const handler = new ErrorHandler({ autoSkipParseErrors: true })
            const error = IpuaroError.parse("Syntax error")

            const result = await handler.handle(error)

            expect(result.action).toBe("skip")
            expect(result.shouldContinue).toBe(true)
        })

        it("should auto-retry LLM errors when enabled", async () => {
            const handler = new ErrorHandler({ autoRetryLLMErrors: true })
            const error = IpuaroError.llm("Timeout")

            const result = await handler.handle(error, "test-key")

            expect(result.action).toBe("retry")
            expect(result.shouldContinue).toBe(true)
            expect(result.retryCount).toBe(1)
        })

        it("should track retry count", async () => {
            const handler = new ErrorHandler({ autoRetryLLMErrors: true })
            const error = IpuaroError.llm("Timeout")

            await handler.handle(error, "test-key")
            await handler.handle(error, "test-key")
            const result = await handler.handle(error, "test-key")

            expect(result.retryCount).toBe(3)
        })

        it("should abort after max retries", async () => {
            const handler = new ErrorHandler({ autoRetryLLMErrors: true, maxRetries: 2 })
            const error = IpuaroError.llm("Timeout")

            await handler.handle(error, "test-key")
            await handler.handle(error, "test-key")
            const result = await handler.handle(error, "test-key")

            expect(result.action).toBe("abort")
            expect(result.shouldContinue).toBe(false)
        })
    })

    describe("handleSync", () => {
        it("should abort non-recoverable errors", () => {
            const error = IpuaroError.redis("Connection failed")

            const result = handler.handleSync(error)

            expect(result.action).toBe("abort")
            expect(result.shouldContinue).toBe(false)
        })

        it("should use default option for recoverable errors", () => {
            const error = IpuaroError.file("Not found")

            const result = handler.handleSync(error)

            expect(result.action).toBe("skip")
            expect(result.shouldContinue).toBe(true)
        })
    })

    describe("resetRetries", () => {
        it("should reset specific context", async () => {
            const handler = new ErrorHandler({ autoRetryLLMErrors: true })
            const error = IpuaroError.llm("Timeout")

            await handler.handle(error, "key1")
            await handler.handle(error, "key1")
            handler.resetRetries("key1")

            expect(handler.getRetryCount("key1")).toBe(0)
        })

        it("should reset all contexts when no key provided", async () => {
            const handler = new ErrorHandler({ autoRetryLLMErrors: true })
            const error = IpuaroError.llm("Timeout")

            await handler.handle(error, "key1")
            await handler.handle(error, "key2")
            handler.resetRetries()

            expect(handler.getRetryCount("key1")).toBe(0)
            expect(handler.getRetryCount("key2")).toBe(0)
        })
    })

    describe("getRetryCount", () => {
        it("should return 0 for unknown context", () => {
            expect(handler.getRetryCount("unknown")).toBe(0)
        })
    })

    describe("isMaxRetriesExceeded", () => {
        it("should return false when retries not exceeded", () => {
            expect(handler.isMaxRetriesExceeded("test")).toBe(false)
        })

        it("should return true when retries exceeded", async () => {
            const handler = new ErrorHandler({ autoRetryLLMErrors: true, maxRetries: 1 })
            const error = IpuaroError.llm("Timeout")

            await handler.handle(error, "test")

            expect(handler.isMaxRetriesExceeded("test")).toBe(true)
        })
    })

    describe("wrap", () => {
        it("should return success result on success", async () => {
            const fn = vi.fn().mockResolvedValue("result")

            const result = await handler.wrap(fn, "llm")

            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data).toBe("result")
            }
        })

        it("should return error result on failure", async () => {
            const fn = vi.fn().mockRejectedValue(new Error("Failed"))

            const result = await handler.wrap(fn, "llm")

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.result.action).toBe("retry")
            }
        })

        it("should handle IpuaroError directly", async () => {
            const fn = vi.fn().mockRejectedValue(IpuaroError.file("Not found"))

            const result = await handler.wrap(fn, "llm")

            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.result.action).toBe("skip")
            }
        })

        it("should reset retries on success", async () => {
            const handler = new ErrorHandler({ autoRetryLLMErrors: true })
            const error = IpuaroError.llm("Timeout")

            await handler.handle(error, "test-key")
            await handler.wrap(() => Promise.resolve("ok"), "llm", "test-key")

            expect(handler.getRetryCount("test-key")).toBe(0)
        })
    })

    describe("withRetry", () => {
        it("should return result on success", async () => {
            const fn = vi.fn().mockResolvedValue("result")

            const result = await handler.withRetry(fn, "llm", "test")

            expect(result).toBe("result")
        })

        it("should retry on failure", async () => {
            const fn = vi
                .fn()
                .mockRejectedValueOnce(new Error("Fail 1"))
                .mockResolvedValueOnce("success")
            const handler = new ErrorHandler({
                onError: vi.fn().mockResolvedValue("retry"),
            })

            const result = await handler.withRetry(fn, "llm", "test")

            expect(result).toBe("success")
            expect(fn).toHaveBeenCalledTimes(2)
        })

        it("should throw after max retries", async () => {
            const fn = vi.fn().mockRejectedValue(new Error("Always fails"))
            const handler = new ErrorHandler({
                maxRetries: 2,
                onError: vi.fn().mockResolvedValue("retry"),
            })

            await expect(handler.withRetry(fn, "llm", "test")).rejects.toThrow("Max retries")
        })

        it("should throw immediately when skip is chosen", async () => {
            const fn = vi.fn().mockRejectedValue(new Error("Fail"))
            const handler = new ErrorHandler({
                onError: vi.fn().mockResolvedValue("skip"),
            })

            await expect(handler.withRetry(fn, "llm", "test")).rejects.toThrow("Fail")
        })
    })
})

describe("utility functions", () => {
    describe("getErrorOptions", () => {
        it("should return options for error type", () => {
            const options = getErrorOptions("llm")

            expect(options).toEqual(["retry", "skip", "abort"])
        })
    })

    describe("getDefaultErrorOption", () => {
        it("should return default option for error type", () => {
            expect(getDefaultErrorOption("llm")).toBe("retry")
            expect(getDefaultErrorOption("parse")).toBe("skip")
            expect(getDefaultErrorOption("redis")).toBe("abort")
        })
    })

    describe("isRecoverableError", () => {
        it("should return true for recoverable errors", () => {
            expect(isRecoverableError("llm")).toBe(true)
            expect(isRecoverableError("parse")).toBe(true)
            expect(isRecoverableError("file")).toBe(true)
        })

        it("should return false for non-recoverable errors", () => {
            expect(isRecoverableError("redis")).toBe(false)
            expect(isRecoverableError("unknown")).toBe(false)
        })
    })

    describe("toIpuaroError", () => {
        it("should return IpuaroError as-is", () => {
            const error = IpuaroError.llm("Timeout")

            const result = toIpuaroError(error)

            expect(result).toBe(error)
        })

        it("should convert Error to IpuaroError", () => {
            const error = new Error("Something went wrong")

            const result = toIpuaroError(error, "llm")

            expect(result).toBeInstanceOf(IpuaroError)
            expect(result.type).toBe("llm")
            expect(result.message).toBe("Something went wrong")
        })

        it("should convert string to IpuaroError", () => {
            const result = toIpuaroError("Error message", "file")

            expect(result).toBeInstanceOf(IpuaroError)
            expect(result.type).toBe("file")
            expect(result.message).toBe("Error message")
        })

        it("should use unknown type by default", () => {
            const result = toIpuaroError("Error")

            expect(result.type).toBe("unknown")
        })
    })

    describe("createErrorHandler", () => {
        it("should create handler with default options", () => {
            const handler = createErrorHandler()

            expect(handler).toBeInstanceOf(ErrorHandler)
        })

        it("should create handler with custom options", () => {
            const handler = createErrorHandler({ maxRetries: 5 })

            expect(handler).toBeInstanceOf(ErrorHandler)
        })
    })
})
