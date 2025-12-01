import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
    checkRedis,
    checkOllama,
    checkModel,
    checkProjectSize,
    runOnboarding,
} from "../../../../src/cli/commands/onboarding.js"
import { RedisClient } from "../../../../src/infrastructure/storage/RedisClient.js"
import { OllamaClient } from "../../../../src/infrastructure/llm/OllamaClient.js"
import { FileScanner } from "../../../../src/infrastructure/indexer/FileScanner.js"

vi.mock("../../../../src/infrastructure/storage/RedisClient.js")
vi.mock("../../../../src/infrastructure/llm/OllamaClient.js")
vi.mock("../../../../src/infrastructure/indexer/FileScanner.js")

describe("onboarding", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe("checkRedis", () => {
        it("should return ok when Redis connects and pings successfully", async () => {
            const mockConnect = vi.fn().mockResolvedValue(undefined)
            const mockPing = vi.fn().mockResolvedValue(true)
            const mockDisconnect = vi.fn().mockResolvedValue(undefined)

            vi.mocked(RedisClient).mockImplementation(
                () =>
                    ({
                        connect: mockConnect,
                        ping: mockPing,
                        disconnect: mockDisconnect,
                    }) as unknown as RedisClient,
            )

            const result = await checkRedis({
                host: "localhost",
                port: 6379,
                db: 0,
                keyPrefix: "ipuaro:",
            })

            expect(result.ok).toBe(true)
            expect(result.error).toBeUndefined()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockPing).toHaveBeenCalled()
            expect(mockDisconnect).toHaveBeenCalled()
        })

        it("should return error when Redis connection fails", async () => {
            vi.mocked(RedisClient).mockImplementation(
                () =>
                    ({
                        connect: vi.fn().mockRejectedValue(new Error("Connection refused")),
                    }) as unknown as RedisClient,
            )

            const result = await checkRedis({
                host: "localhost",
                port: 6379,
                db: 0,
                keyPrefix: "ipuaro:",
            })

            expect(result.ok).toBe(false)
            expect(result.error).toContain("Cannot connect to Redis")
        })

        it("should return error when ping fails", async () => {
            vi.mocked(RedisClient).mockImplementation(
                () =>
                    ({
                        connect: vi.fn().mockResolvedValue(undefined),
                        ping: vi.fn().mockResolvedValue(false),
                        disconnect: vi.fn().mockResolvedValue(undefined),
                    }) as unknown as RedisClient,
            )

            const result = await checkRedis({
                host: "localhost",
                port: 6379,
                db: 0,
                keyPrefix: "ipuaro:",
            })

            expect(result.ok).toBe(false)
            expect(result.error).toContain("Redis ping failed")
        })
    })

    describe("checkOllama", () => {
        it("should return ok when Ollama is available", async () => {
            vi.mocked(OllamaClient).mockImplementation(
                () =>
                    ({
                        isAvailable: vi.fn().mockResolvedValue(true),
                    }) as unknown as OllamaClient,
            )

            const result = await checkOllama({
                model: "qwen2.5-coder:7b-instruct",
                contextWindow: 128_000,
                temperature: 0.1,
                host: "http://localhost:11434",
                timeout: 120_000,
            })

            expect(result.ok).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it("should return error when Ollama is not available", async () => {
            vi.mocked(OllamaClient).mockImplementation(
                () =>
                    ({
                        isAvailable: vi.fn().mockResolvedValue(false),
                    }) as unknown as OllamaClient,
            )

            const result = await checkOllama({
                model: "qwen2.5-coder:7b-instruct",
                contextWindow: 128_000,
                temperature: 0.1,
                host: "http://localhost:11434",
                timeout: 120_000,
            })

            expect(result.ok).toBe(false)
            expect(result.error).toContain("Cannot connect to Ollama")
        })
    })

    describe("checkModel", () => {
        it("should return ok when model is available", async () => {
            vi.mocked(OllamaClient).mockImplementation(
                () =>
                    ({
                        hasModel: vi.fn().mockResolvedValue(true),
                    }) as unknown as OllamaClient,
            )

            const result = await checkModel({
                model: "qwen2.5-coder:7b-instruct",
                contextWindow: 128_000,
                temperature: 0.1,
                host: "http://localhost:11434",
                timeout: 120_000,
            })

            expect(result.ok).toBe(true)
            expect(result.needsPull).toBe(false)
        })

        it("should return needsPull when model is not available", async () => {
            vi.mocked(OllamaClient).mockImplementation(
                () =>
                    ({
                        hasModel: vi.fn().mockResolvedValue(false),
                    }) as unknown as OllamaClient,
            )

            const result = await checkModel({
                model: "qwen2.5-coder:7b-instruct",
                contextWindow: 128_000,
                temperature: 0.1,
                host: "http://localhost:11434",
                timeout: 120_000,
            })

            expect(result.ok).toBe(false)
            expect(result.needsPull).toBe(true)
            expect(result.error).toContain("not installed")
        })
    })

    describe("checkProjectSize", () => {
        it("should return ok when file count is within limits", async () => {
            vi.mocked(FileScanner).mockImplementation(
                () =>
                    ({
                        scanAll: vi.fn().mockResolvedValue(
                            Array.from({ length: 100 }, (_, i) => ({
                                path: `file${String(i)}.ts`,
                                type: "file" as const,
                                size: 1000,
                                lastModified: Date.now(),
                            })),
                        ),
                    }) as unknown as FileScanner,
            )

            const result = await checkProjectSize("/test/path")

            expect(result.ok).toBe(true)
            expect(result.fileCount).toBe(100)
            expect(result.warning).toBeUndefined()
        })

        it("should return warning when file count exceeds limit", async () => {
            vi.mocked(FileScanner).mockImplementation(
                () =>
                    ({
                        scanAll: vi.fn().mockResolvedValue(
                            Array.from({ length: 15000 }, (_, i) => ({
                                path: `file${String(i)}.ts`,
                                type: "file" as const,
                                size: 1000,
                                lastModified: Date.now(),
                            })),
                        ),
                    }) as unknown as FileScanner,
            )

            const result = await checkProjectSize("/test/path", 10_000)

            expect(result.ok).toBe(true)
            expect(result.fileCount).toBe(15000)
            expect(result.warning).toContain("15")
            expect(result.warning).toContain("000 files")
        })

        it("should return error when no files found", async () => {
            vi.mocked(FileScanner).mockImplementation(
                () =>
                    ({
                        scanAll: vi.fn().mockResolvedValue([]),
                    }) as unknown as FileScanner,
            )

            const result = await checkProjectSize("/test/path")

            expect(result.ok).toBe(false)
            expect(result.fileCount).toBe(0)
            expect(result.warning).toContain("No supported files found")
        })
    })

    describe("runOnboarding", () => {
        it("should return success when all checks pass", async () => {
            vi.mocked(RedisClient).mockImplementation(
                () =>
                    ({
                        connect: vi.fn().mockResolvedValue(undefined),
                        ping: vi.fn().mockResolvedValue(true),
                        disconnect: vi.fn().mockResolvedValue(undefined),
                    }) as unknown as RedisClient,
            )

            vi.mocked(OllamaClient).mockImplementation(
                () =>
                    ({
                        isAvailable: vi.fn().mockResolvedValue(true),
                        hasModel: vi.fn().mockResolvedValue(true),
                    }) as unknown as OllamaClient,
            )

            vi.mocked(FileScanner).mockImplementation(
                () =>
                    ({
                        scanAll: vi.fn().mockResolvedValue([{ path: "file.ts" }]),
                    }) as unknown as FileScanner,
            )

            const result = await runOnboarding({
                redisConfig: { host: "localhost", port: 6379, db: 0, keyPrefix: "ipuaro:" },
                llmConfig: {
                    model: "test",
                    contextWindow: 128_000,
                    temperature: 0.1,
                    host: "http://localhost:11434",
                    timeout: 120_000,
                },
                projectPath: "/test/path",
            })

            expect(result.success).toBe(true)
            expect(result.redisOk).toBe(true)
            expect(result.ollamaOk).toBe(true)
            expect(result.modelOk).toBe(true)
            expect(result.projectOk).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it("should return failure when Redis fails", async () => {
            vi.mocked(RedisClient).mockImplementation(
                () =>
                    ({
                        connect: vi.fn().mockRejectedValue(new Error("Connection refused")),
                    }) as unknown as RedisClient,
            )

            vi.mocked(OllamaClient).mockImplementation(
                () =>
                    ({
                        isAvailable: vi.fn().mockResolvedValue(true),
                        hasModel: vi.fn().mockResolvedValue(true),
                    }) as unknown as OllamaClient,
            )

            vi.mocked(FileScanner).mockImplementation(
                () =>
                    ({
                        scanAll: vi.fn().mockResolvedValue([{ path: "file.ts" }]),
                    }) as unknown as FileScanner,
            )

            const result = await runOnboarding({
                redisConfig: { host: "localhost", port: 6379, db: 0, keyPrefix: "ipuaro:" },
                llmConfig: {
                    model: "test",
                    contextWindow: 128_000,
                    temperature: 0.1,
                    host: "http://localhost:11434",
                    timeout: 120_000,
                },
                projectPath: "/test/path",
            })

            expect(result.success).toBe(false)
            expect(result.redisOk).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
        })

        it("should skip checks when skip options are set", async () => {
            const result = await runOnboarding({
                redisConfig: { host: "localhost", port: 6379, db: 0, keyPrefix: "ipuaro:" },
                llmConfig: {
                    model: "test",
                    contextWindow: 128_000,
                    temperature: 0.1,
                    host: "http://localhost:11434",
                    timeout: 120_000,
                },
                projectPath: "/test/path",
                skipRedis: true,
                skipOllama: true,
                skipModel: true,
                skipProject: true,
            })

            expect(result.success).toBe(true)
            expect(result.redisOk).toBe(true)
            expect(result.ollamaOk).toBe(true)
            expect(result.modelOk).toBe(true)
            expect(result.projectOk).toBe(true)
        })
    })
})
