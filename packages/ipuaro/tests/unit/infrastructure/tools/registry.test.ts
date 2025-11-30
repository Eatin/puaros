import { describe, it, expect, vi, beforeEach } from "vitest"
import { ToolRegistry } from "../../../../src/infrastructure/tools/registry.js"
import type {
    ITool,
    ToolContext,
    ToolParameterSchema,
} from "../../../../src/domain/services/ITool.js"
import type { ToolResult } from "../../../../src/domain/value-objects/ToolResult.js"
import { IpuaroError } from "../../../../src/shared/errors/IpuaroError.js"

/**
 * Creates a mock tool for testing.
 */
function createMockTool(overrides: Partial<ITool> = {}): ITool {
    return {
        name: "mock_tool",
        description: "A mock tool for testing",
        parameters: [
            {
                name: "path",
                type: "string",
                description: "File path",
                required: true,
            },
            {
                name: "optional",
                type: "number",
                description: "Optional param",
                required: false,
            },
        ],
        requiresConfirmation: false,
        category: "read",
        execute: vi.fn().mockResolvedValue({
            callId: "test-123",
            success: true,
            data: { result: "success" },
            executionTimeMs: 10,
        }),
        validateParams: vi.fn().mockReturnValue(null),
        ...overrides,
    }
}

/**
 * Creates a mock tool context for testing.
 */
function createMockContext(overrides: Partial<ToolContext> = {}): ToolContext {
    return {
        projectRoot: "/test/project",
        storage: {} as ToolContext["storage"],
        requestConfirmation: vi.fn().mockResolvedValue(true),
        onProgress: vi.fn(),
        ...overrides,
    }
}

describe("ToolRegistry", () => {
    let registry: ToolRegistry

    beforeEach(() => {
        registry = new ToolRegistry()
    })

    describe("register", () => {
        it("should register a tool", () => {
            const tool = createMockTool()

            registry.register(tool)

            expect(registry.has("mock_tool")).toBe(true)
            expect(registry.size).toBe(1)
        })

        it("should register multiple tools", () => {
            const tool1 = createMockTool({ name: "tool_1" })
            const tool2 = createMockTool({ name: "tool_2" })

            registry.register(tool1)
            registry.register(tool2)

            expect(registry.size).toBe(2)
            expect(registry.has("tool_1")).toBe(true)
            expect(registry.has("tool_2")).toBe(true)
        })

        it("should throw error when registering duplicate tool name", () => {
            const tool1 = createMockTool({ name: "duplicate" })
            const tool2 = createMockTool({ name: "duplicate" })

            registry.register(tool1)

            expect(() => registry.register(tool2)).toThrow(IpuaroError)
            expect(() => registry.register(tool2)).toThrow('Tool "duplicate" is already registered')
        })
    })

    describe("unregister", () => {
        it("should remove a registered tool", () => {
            const tool = createMockTool()
            registry.register(tool)

            const result = registry.unregister("mock_tool")

            expect(result).toBe(true)
            expect(registry.has("mock_tool")).toBe(false)
            expect(registry.size).toBe(0)
        })

        it("should return false when tool not found", () => {
            const result = registry.unregister("nonexistent")

            expect(result).toBe(false)
        })
    })

    describe("get", () => {
        it("should return registered tool", () => {
            const tool = createMockTool()
            registry.register(tool)

            const result = registry.get("mock_tool")

            expect(result).toBe(tool)
        })

        it("should return undefined for unknown tool", () => {
            const result = registry.get("unknown")

            expect(result).toBeUndefined()
        })
    })

    describe("getAll", () => {
        it("should return empty array when no tools registered", () => {
            const result = registry.getAll()

            expect(result).toEqual([])
        })

        it("should return all registered tools", () => {
            const tool1 = createMockTool({ name: "tool_1" })
            const tool2 = createMockTool({ name: "tool_2" })
            registry.register(tool1)
            registry.register(tool2)

            const result = registry.getAll()

            expect(result).toHaveLength(2)
            expect(result).toContain(tool1)
            expect(result).toContain(tool2)
        })
    })

    describe("getByCategory", () => {
        it("should return tools by category", () => {
            const readTool = createMockTool({ name: "read_tool", category: "read" })
            const editTool = createMockTool({ name: "edit_tool", category: "edit" })
            const gitTool = createMockTool({ name: "git_tool", category: "git" })
            registry.register(readTool)
            registry.register(editTool)
            registry.register(gitTool)

            const readTools = registry.getByCategory("read")
            const editTools = registry.getByCategory("edit")

            expect(readTools).toHaveLength(1)
            expect(readTools[0]).toBe(readTool)
            expect(editTools).toHaveLength(1)
            expect(editTools[0]).toBe(editTool)
        })

        it("should return empty array for category with no tools", () => {
            const readTool = createMockTool({ category: "read" })
            registry.register(readTool)

            const result = registry.getByCategory("analysis")

            expect(result).toEqual([])
        })
    })

    describe("has", () => {
        it("should return true for registered tool", () => {
            registry.register(createMockTool())

            expect(registry.has("mock_tool")).toBe(true)
        })

        it("should return false for unknown tool", () => {
            expect(registry.has("unknown")).toBe(false)
        })
    })

    describe("execute", () => {
        it("should execute tool and return result", async () => {
            const tool = createMockTool()
            registry.register(tool)
            const ctx = createMockContext()

            const result = await registry.execute("mock_tool", { path: "test.ts" }, ctx)

            expect(result.success).toBe(true)
            expect(result.data).toEqual({ result: "success" })
            expect(tool.execute).toHaveBeenCalledWith({ path: "test.ts" }, ctx)
        })

        it("should return error result for unknown tool", async () => {
            const ctx = createMockContext()

            const result = await registry.execute("unknown", {}, ctx)

            expect(result.success).toBe(false)
            expect(result.error).toBe('Tool "unknown" not found')
        })

        it("should return error result when validation fails", async () => {
            const tool = createMockTool({
                validateParams: vi.fn().mockReturnValue("Missing required param: path"),
            })
            registry.register(tool)
            const ctx = createMockContext()

            const result = await registry.execute("mock_tool", {}, ctx)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Missing required param: path")
            expect(tool.execute).not.toHaveBeenCalled()
        })

        it("should request confirmation for tools that require it", async () => {
            const tool = createMockTool({ requiresConfirmation: true })
            registry.register(tool)
            const ctx = createMockContext()

            await registry.execute("mock_tool", { path: "test.ts" }, ctx)

            expect(ctx.requestConfirmation).toHaveBeenCalled()
            expect(tool.execute).toHaveBeenCalled()
        })

        it("should not execute when confirmation is denied", async () => {
            const tool = createMockTool({ requiresConfirmation: true })
            registry.register(tool)
            const ctx = createMockContext({
                requestConfirmation: vi.fn().mockResolvedValue(false),
            })

            const result = await registry.execute("mock_tool", { path: "test.ts" }, ctx)

            expect(result.success).toBe(false)
            expect(result.error).toBe("User cancelled operation")
            expect(tool.execute).not.toHaveBeenCalled()
        })

        it("should not request confirmation for safe tools", async () => {
            const tool = createMockTool({ requiresConfirmation: false })
            registry.register(tool)
            const ctx = createMockContext()

            await registry.execute("mock_tool", { path: "test.ts" }, ctx)

            expect(ctx.requestConfirmation).not.toHaveBeenCalled()
            expect(tool.execute).toHaveBeenCalled()
        })

        it("should catch and return errors from tool execution", async () => {
            const tool = createMockTool({
                execute: vi.fn().mockRejectedValue(new Error("Execution failed")),
            })
            registry.register(tool)
            const ctx = createMockContext()

            const result = await registry.execute("mock_tool", { path: "test.ts" }, ctx)

            expect(result.success).toBe(false)
            expect(result.error).toBe("Execution failed")
        })

        it("should include callId in result", async () => {
            const tool = createMockTool()
            registry.register(tool)
            const ctx = createMockContext()

            const result = await registry.execute("mock_tool", { path: "test.ts" }, ctx)

            expect(result.callId).toMatch(/^mock_tool-\d+$/)
        })
    })

    describe("getToolDefinitions", () => {
        it("should return empty array when no tools registered", () => {
            const result = registry.getToolDefinitions()

            expect(result).toEqual([])
        })

        it("should convert tools to LLM-compatible format", () => {
            const tool = createMockTool()
            registry.register(tool)

            const result = registry.getToolDefinitions()

            expect(result).toHaveLength(1)
            expect(result[0]).toEqual({
                name: "mock_tool",
                description: "A mock tool for testing",
                parameters: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "File path",
                        },
                        optional: {
                            type: "number",
                            description: "Optional param",
                        },
                    },
                    required: ["path"],
                },
            })
        })

        it("should handle tools with no parameters", () => {
            const tool = createMockTool({ parameters: [] })
            registry.register(tool)

            const result = registry.getToolDefinitions()

            expect(result[0].parameters).toEqual({
                type: "object",
                properties: {},
                required: [],
            })
        })

        it("should handle multiple tools", () => {
            registry.register(createMockTool({ name: "tool_1" }))
            registry.register(createMockTool({ name: "tool_2" }))

            const result = registry.getToolDefinitions()

            expect(result).toHaveLength(2)
            expect(result.map((t) => t.name)).toEqual(["tool_1", "tool_2"])
        })
    })

    describe("clear", () => {
        it("should remove all tools", () => {
            registry.register(createMockTool({ name: "tool_1" }))
            registry.register(createMockTool({ name: "tool_2" }))

            registry.clear()

            expect(registry.size).toBe(0)
            expect(registry.getAll()).toEqual([])
        })
    })

    describe("getNames", () => {
        it("should return all tool names", () => {
            registry.register(createMockTool({ name: "alpha" }))
            registry.register(createMockTool({ name: "beta" }))

            const result = registry.getNames()

            expect(result).toEqual(["alpha", "beta"])
        })

        it("should return empty array when no tools", () => {
            const result = registry.getNames()

            expect(result).toEqual([])
        })
    })

    describe("getConfirmationTools", () => {
        it("should return only tools requiring confirmation", () => {
            registry.register(createMockTool({ name: "safe", requiresConfirmation: false }))
            registry.register(createMockTool({ name: "dangerous", requiresConfirmation: true }))
            registry.register(createMockTool({ name: "also_safe", requiresConfirmation: false }))

            const result = registry.getConfirmationTools()

            expect(result).toHaveLength(1)
            expect(result[0].name).toBe("dangerous")
        })
    })

    describe("getSafeTools", () => {
        it("should return only tools not requiring confirmation", () => {
            registry.register(createMockTool({ name: "safe", requiresConfirmation: false }))
            registry.register(createMockTool({ name: "dangerous", requiresConfirmation: true }))
            registry.register(createMockTool({ name: "also_safe", requiresConfirmation: false }))

            const result = registry.getSafeTools()

            expect(result).toHaveLength(2)
            expect(result.map((t) => t.name)).toEqual(["safe", "also_safe"])
        })
    })

    describe("size", () => {
        it("should return 0 for empty registry", () => {
            expect(registry.size).toBe(0)
        })

        it("should return correct count", () => {
            registry.register(createMockTool({ name: "a" }))
            registry.register(createMockTool({ name: "b" }))
            registry.register(createMockTool({ name: "c" }))

            expect(registry.size).toBe(3)
        })
    })

    describe("integration scenarios", () => {
        it("should handle full workflow: register, execute, unregister", async () => {
            const tool = createMockTool()
            const ctx = createMockContext()

            registry.register(tool)
            expect(registry.has("mock_tool")).toBe(true)

            const result = await registry.execute("mock_tool", { path: "test.ts" }, ctx)
            expect(result.success).toBe(true)

            registry.unregister("mock_tool")
            expect(registry.has("mock_tool")).toBe(false)

            const afterUnregister = await registry.execute("mock_tool", {}, ctx)
            expect(afterUnregister.success).toBe(false)
        })

        it("should maintain isolation between registrations", () => {
            const registry1 = new ToolRegistry()
            const registry2 = new ToolRegistry()

            registry1.register(createMockTool({ name: "tool_1" }))
            registry2.register(createMockTool({ name: "tool_2" }))

            expect(registry1.has("tool_1")).toBe(true)
            expect(registry1.has("tool_2")).toBe(false)
            expect(registry2.has("tool_1")).toBe(false)
            expect(registry2.has("tool_2")).toBe(true)
        })
    })
})
