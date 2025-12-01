import type { IToolRegistry } from "../../application/interfaces/IToolRegistry.js"
import type { ITool, ToolContext, ToolParameterSchema } from "../../domain/services/ITool.js"
import { createErrorResult, type ToolResult } from "../../domain/value-objects/ToolResult.js"
import { IpuaroError } from "../../shared/errors/IpuaroError.js"

/**
 * Tool registry implementation.
 * Manages registration and execution of tools.
 */
export class ToolRegistry implements IToolRegistry {
    private readonly tools = new Map<string, ITool>()

    /**
     * Register a tool.
     * @throws IpuaroError if tool with same name already registered
     */
    register(tool: ITool): void {
        if (this.tools.has(tool.name)) {
            throw IpuaroError.validation(`Tool "${tool.name}" is already registered`)
        }
        this.tools.set(tool.name, tool)
    }

    /**
     * Unregister a tool by name.
     * @returns true if tool was removed, false if not found
     */
    unregister(name: string): boolean {
        return this.tools.delete(name)
    }

    /**
     * Get tool by name.
     */
    get(name: string): ITool | undefined {
        return this.tools.get(name)
    }

    /**
     * Get all registered tools.
     */
    getAll(): ITool[] {
        return Array.from(this.tools.values())
    }

    /**
     * Get tools by category.
     */
    getByCategory(category: ITool["category"]): ITool[] {
        return this.getAll().filter((tool) => tool.category === category)
    }

    /**
     * Check if tool exists.
     */
    has(name: string): boolean {
        return this.tools.has(name)
    }

    /**
     * Get number of registered tools.
     */
    get size(): number {
        return this.tools.size
    }

    /**
     * Execute tool by name.
     * @throws IpuaroError if tool not found
     */
    async execute(
        name: string,
        params: Record<string, unknown>,
        ctx: ToolContext,
    ): Promise<ToolResult> {
        const startTime = Date.now()
        const callId = `${name}-${String(startTime)}`

        const tool = this.tools.get(name)
        if (!tool) {
            return createErrorResult(callId, `Tool "${name}" not found`, Date.now() - startTime)
        }

        const validationError = tool.validateParams(params)
        if (validationError) {
            return createErrorResult(callId, validationError, Date.now() - startTime)
        }

        if (tool.requiresConfirmation) {
            const confirmed = await ctx.requestConfirmation(
                `Execute "${name}" with params: ${JSON.stringify(params)}`,
            )
            if (!confirmed) {
                return createErrorResult(callId, "User cancelled operation", Date.now() - startTime)
            }
        }

        try {
            const result = await tool.execute(params, ctx)
            return {
                ...result,
                callId,
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return createErrorResult(callId, message, Date.now() - startTime)
        }
    }

    /**
     * Get tool definitions for LLM.
     * Converts ITool[] to LLM-compatible format.
     */
    getToolDefinitions(): {
        name: string
        description: string
        parameters: {
            type: "object"
            properties: Record<string, { type: string; description: string }>
            required: string[]
        }
    }[] {
        return this.getAll().map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: this.convertParametersToSchema(tool.parameters),
        }))
    }

    /**
     * Convert tool parameters to JSON Schema format.
     */
    private convertParametersToSchema(params: ToolParameterSchema[]): {
        type: "object"
        properties: Record<string, { type: string; description: string }>
        required: string[]
    } {
        const properties: Record<string, { type: string; description: string }> = {}
        const required: string[] = []

        for (const param of params) {
            properties[param.name] = {
                type: param.type,
                description: param.description,
            }
            if (param.required) {
                required.push(param.name)
            }
        }

        return {
            type: "object",
            properties,
            required,
        }
    }

    /**
     * Clear all registered tools.
     */
    clear(): void {
        this.tools.clear()
    }

    /**
     * Get tool names.
     */
    getNames(): string[] {
        return Array.from(this.tools.keys())
    }

    /**
     * Get tools that require confirmation.
     */
    getConfirmationTools(): ITool[] {
        return this.getAll().filter((tool) => tool.requiresConfirmation)
    }

    /**
     * Get tools that don't require confirmation.
     */
    getSafeTools(): ITool[] {
        return this.getAll().filter((tool) => !tool.requiresConfirmation)
    }
}
