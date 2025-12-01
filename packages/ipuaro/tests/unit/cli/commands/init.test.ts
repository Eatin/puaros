import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import * as fs from "node:fs/promises"
import * as path from "node:path"
import { executeInit } from "../../../../src/cli/commands/init.js"

vi.mock("node:fs/promises")

describe("executeInit", () => {
    const testPath = "/test/project"
    const configPath = path.join(testPath, ".ipuaro.json")

    beforeEach(() => {
        vi.clearAllMocks()
        vi.spyOn(console, "warn").mockImplementation(() => {})
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("should create .ipuaro.json file successfully", async () => {
        vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"))
        vi.mocked(fs.mkdir).mockResolvedValue(undefined)
        vi.mocked(fs.writeFile).mockResolvedValue(undefined)

        const result = await executeInit(testPath)

        expect(result.success).toBe(true)
        expect(result.filePath).toBe(configPath)
        expect(fs.writeFile).toHaveBeenCalledWith(
            configPath,
            expect.stringContaining('"redis"'),
            "utf-8",
        )
    })

    it("should skip existing file without force option", async () => {
        vi.mocked(fs.access).mockResolvedValue(undefined)

        const result = await executeInit(testPath)

        expect(result.success).toBe(true)
        expect(result.skipped).toBe(true)
        expect(fs.writeFile).not.toHaveBeenCalled()
    })

    it("should overwrite existing file with force option", async () => {
        vi.mocked(fs.access).mockResolvedValue(undefined)
        vi.mocked(fs.writeFile).mockResolvedValue(undefined)

        const result = await executeInit(testPath, { force: true })

        expect(result.success).toBe(true)
        expect(result.skipped).toBeUndefined()
        expect(fs.writeFile).toHaveBeenCalled()
    })

    it("should handle write errors", async () => {
        vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"))
        vi.mocked(fs.mkdir).mockResolvedValue(undefined)
        vi.mocked(fs.writeFile).mockRejectedValue(new Error("Permission denied"))

        const result = await executeInit(testPath)

        expect(result.success).toBe(false)
        expect(result.error).toContain("Permission denied")
    })

    it("should create parent directories if needed", async () => {
        vi.mocked(fs.access)
            .mockRejectedValueOnce(new Error("ENOENT"))
            .mockRejectedValueOnce(new Error("ENOENT"))
        vi.mocked(fs.mkdir).mockResolvedValue(undefined)
        vi.mocked(fs.writeFile).mockResolvedValue(undefined)

        const result = await executeInit(testPath)

        expect(result.success).toBe(true)
        expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true })
    })

    it("should use current directory as default", async () => {
        vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"))
        vi.mocked(fs.mkdir).mockResolvedValue(undefined)
        vi.mocked(fs.writeFile).mockResolvedValue(undefined)

        const result = await executeInit()

        expect(result.success).toBe(true)
        expect(result.filePath).toContain(".ipuaro.json")
    })

    it("should include expected config sections", async () => {
        vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"))
        vi.mocked(fs.mkdir).mockResolvedValue(undefined)
        vi.mocked(fs.writeFile).mockResolvedValue(undefined)

        await executeInit(testPath)

        const writeCall = vi.mocked(fs.writeFile).mock.calls[0]
        const content = writeCall[1] as string
        const config = JSON.parse(content) as {
            redis: unknown
            llm: unknown
            edit: unknown
        }

        expect(config).toHaveProperty("redis")
        expect(config).toHaveProperty("llm")
        expect(config).toHaveProperty("edit")
        expect(config.redis).toHaveProperty("host", "localhost")
        expect(config.redis).toHaveProperty("port", 6379)
        expect(config.llm).toHaveProperty("model", "qwen2.5-coder:7b-instruct")
        expect(config.edit).toHaveProperty("autoApply", false)
    })
})
