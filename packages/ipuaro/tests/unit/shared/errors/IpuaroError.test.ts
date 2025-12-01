import { describe, it, expect } from "vitest"
import { ERROR_MATRIX, IpuaroError } from "../../../../src/shared/errors/IpuaroError.js"

describe("IpuaroError", () => {
    describe("constructor", () => {
        it("should create error with all fields", () => {
            const error = new IpuaroError("file", "Not found", {
                suggestion: "Check path",
                context: { filePath: "/test.ts" },
            })

            expect(error.name).toBe("IpuaroError")
            expect(error.type).toBe("file")
            expect(error.message).toBe("Not found")
            expect(error.recoverable).toBe(true)
            expect(error.suggestion).toBe("Check path")
            expect(error.context).toEqual({ filePath: "/test.ts" })
        })

        it("should use matrix defaults for recoverable", () => {
            const redisError = new IpuaroError("redis", "Connection failed")
            const parseError = new IpuaroError("parse", "Parse failed")

            expect(redisError.recoverable).toBe(false)
            expect(parseError.recoverable).toBe(true)
        })

        it("should allow overriding recoverable", () => {
            const error = new IpuaroError("command", "Blacklisted", {
                recoverable: false,
            })

            expect(error.recoverable).toBe(false)
        })

        it("should have options from matrix", () => {
            const error = new IpuaroError("llm", "Timeout")

            expect(error.options).toEqual(["retry", "skip", "abort"])
            expect(error.defaultOption).toBe("retry")
        })
    })

    describe("getMeta", () => {
        it("should return error metadata", () => {
            const error = IpuaroError.conflict("File changed")

            const meta = error.getMeta()

            expect(meta.type).toBe("conflict")
            expect(meta.recoverable).toBe(true)
            expect(meta.options).toEqual(["skip", "regenerate", "abort"])
            expect(meta.defaultOption).toBe("skip")
        })
    })

    describe("hasOption", () => {
        it("should return true for available option", () => {
            const error = IpuaroError.llm("Timeout")

            expect(error.hasOption("retry")).toBe(true)
            expect(error.hasOption("skip")).toBe(true)
            expect(error.hasOption("abort")).toBe(true)
        })

        it("should return false for unavailable option", () => {
            const error = IpuaroError.parse("Syntax error")

            expect(error.hasOption("retry")).toBe(false)
            expect(error.hasOption("regenerate")).toBe(false)
        })
    })

    describe("toDisplayString", () => {
        it("should format error with suggestion", () => {
            const error = IpuaroError.redis("Connection refused")

            const display = error.toDisplayString()

            expect(display).toContain("[redis]")
            expect(display).toContain("Connection refused")
            expect(display).toContain("Suggestion:")
        })

        it("should format error without suggestion", () => {
            const error = new IpuaroError("unknown", "Something went wrong")

            const display = error.toDisplayString()

            expect(display).toBe("[unknown] Something went wrong")
        })
    })

    describe("static factories", () => {
        it("should create redis error", () => {
            const error = IpuaroError.redis("Connection failed")

            expect(error.type).toBe("redis")
            expect(error.recoverable).toBe(false)
            expect(error.suggestion).toContain("Redis")
            expect(error.options).toEqual(["retry", "abort"])
        })

        it("should create redis error with context", () => {
            const error = IpuaroError.redis("Connection failed", { host: "localhost" })

            expect(error.context).toEqual({ host: "localhost" })
        })

        it("should create parse error", () => {
            const error = IpuaroError.parse("Syntax error", "test.ts")

            expect(error.type).toBe("parse")
            expect(error.message).toContain("test.ts")
            expect(error.recoverable).toBe(true)
            expect(error.context).toEqual({ filePath: "test.ts" })
        })

        it("should create parse error without file", () => {
            const error = IpuaroError.parse("Syntax error")

            expect(error.message).toBe("Syntax error")
            expect(error.context).toBeUndefined()
        })

        it("should create llm error", () => {
            const error = IpuaroError.llm("Timeout")

            expect(error.type).toBe("llm")
            expect(error.recoverable).toBe(true)
            expect(error.suggestion).toContain("Ollama")
        })

        it("should create llmTimeout error", () => {
            const error = IpuaroError.llmTimeout("Request timed out")

            expect(error.type).toBe("timeout")
            expect(error.suggestion).toContain("timed out")
        })

        it("should create file error", () => {
            const error = IpuaroError.file("Not found", "/path/to/file.ts")

            expect(error.type).toBe("file")
            expect(error.context).toEqual({ filePath: "/path/to/file.ts" })
        })

        it("should create fileNotFound error", () => {
            const error = IpuaroError.fileNotFound("/path/to/file.ts")

            expect(error.type).toBe("file")
            expect(error.message).toContain("/path/to/file.ts")
            expect(error.context).toEqual({ filePath: "/path/to/file.ts" })
        })

        it("should create command error", () => {
            const error = IpuaroError.command("Not in whitelist", "rm -rf /")

            expect(error.type).toBe("command")
            expect(error.context).toEqual({ command: "rm -rf /" })
        })

        it("should create commandBlacklisted error", () => {
            const error = IpuaroError.commandBlacklisted("rm -rf /")

            expect(error.type).toBe("command")
            expect(error.recoverable).toBe(false)
            expect(error.message).toContain("blacklisted")
        })

        it("should create conflict error", () => {
            const error = IpuaroError.conflict("File changed", "test.ts")

            expect(error.type).toBe("conflict")
            expect(error.suggestion).toContain("Regenerate")
            expect(error.context).toEqual({ filePath: "test.ts" })
        })

        it("should create validation error", () => {
            const error = IpuaroError.validation("Invalid param", "name")

            expect(error.type).toBe("validation")
            expect(error.context).toEqual({ field: "name" })
        })

        it("should create timeout error", () => {
            const error = IpuaroError.timeout("Request timeout", 5000)

            expect(error.type).toBe("timeout")
            expect(error.suggestion).toContain("timeout")
            expect(error.context).toEqual({ timeoutMs: 5000 })
        })

        it("should create unknown error", () => {
            const original = new Error("Something broke")
            const error = IpuaroError.unknown("Unknown error", original)

            expect(error.type).toBe("unknown")
            expect(error.recoverable).toBe(false)
            expect(error.context).toEqual({ originalError: "Something broke" })
        })
    })

    describe("ERROR_MATRIX", () => {
        it("should have all error types defined", () => {
            const types = [
                "redis",
                "parse",
                "llm",
                "file",
                "command",
                "conflict",
                "validation",
                "timeout",
                "unknown",
            ]

            for (const type of types) {
                expect(ERROR_MATRIX[type as keyof typeof ERROR_MATRIX]).toBeDefined()
            }
        })

        it("should have correct non-recoverable errors", () => {
            expect(ERROR_MATRIX.redis.recoverable).toBe(false)
            expect(ERROR_MATRIX.unknown.recoverable).toBe(false)
        })

        it("should have correct recoverable errors", () => {
            expect(ERROR_MATRIX.parse.recoverable).toBe(true)
            expect(ERROR_MATRIX.llm.recoverable).toBe(true)
            expect(ERROR_MATRIX.file.recoverable).toBe(true)
            expect(ERROR_MATRIX.command.recoverable).toBe(true)
            expect(ERROR_MATRIX.conflict.recoverable).toBe(true)
            expect(ERROR_MATRIX.timeout.recoverable).toBe(true)
        })

        it("should have abort option for all error types", () => {
            for (const config of Object.values(ERROR_MATRIX)) {
                expect(config.options).toContain("abort")
            }
        })
    })
})
