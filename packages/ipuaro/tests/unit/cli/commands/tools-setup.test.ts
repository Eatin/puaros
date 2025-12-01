import { describe, it, expect } from "vitest"
import { registerAllTools } from "../../../../src/cli/commands/tools-setup.js"
import { ToolRegistry } from "../../../../src/infrastructure/tools/registry.js"

describe("registerAllTools", () => {
    it("should register all 18 tools", () => {
        const registry = new ToolRegistry()

        registerAllTools(registry)

        expect(registry.size).toBe(18)
    })

    it("should register all read tools", () => {
        const registry = new ToolRegistry()

        registerAllTools(registry)

        expect(registry.has("get_lines")).toBe(true)
        expect(registry.has("get_function")).toBe(true)
        expect(registry.has("get_class")).toBe(true)
        expect(registry.has("get_structure")).toBe(true)
    })

    it("should register all edit tools", () => {
        const registry = new ToolRegistry()

        registerAllTools(registry)

        expect(registry.has("edit_lines")).toBe(true)
        expect(registry.has("create_file")).toBe(true)
        expect(registry.has("delete_file")).toBe(true)
    })

    it("should register all search tools", () => {
        const registry = new ToolRegistry()

        registerAllTools(registry)

        expect(registry.has("find_references")).toBe(true)
        expect(registry.has("find_definition")).toBe(true)
    })

    it("should register all analysis tools", () => {
        const registry = new ToolRegistry()

        registerAllTools(registry)

        expect(registry.has("get_dependencies")).toBe(true)
        expect(registry.has("get_dependents")).toBe(true)
        expect(registry.has("get_complexity")).toBe(true)
        expect(registry.has("get_todos")).toBe(true)
    })

    it("should register all git tools", () => {
        const registry = new ToolRegistry()

        registerAllTools(registry)

        expect(registry.has("git_status")).toBe(true)
        expect(registry.has("git_diff")).toBe(true)
        expect(registry.has("git_commit")).toBe(true)
    })

    it("should register all run tools", () => {
        const registry = new ToolRegistry()

        registerAllTools(registry)

        expect(registry.has("run_command")).toBe(true)
        expect(registry.has("run_tests")).toBe(true)
    })

    it("should register tools with correct categories", () => {
        const registry = new ToolRegistry()

        registerAllTools(registry)

        const readTools = registry.getByCategory("read")
        const editTools = registry.getByCategory("edit")
        const searchTools = registry.getByCategory("search")
        const analysisTools = registry.getByCategory("analysis")
        const gitTools = registry.getByCategory("git")
        const runTools = registry.getByCategory("run")

        expect(readTools.length).toBe(4)
        expect(editTools.length).toBe(3)
        expect(searchTools.length).toBe(2)
        expect(analysisTools.length).toBe(4)
        expect(gitTools.length).toBe(3)
        expect(runTools.length).toBe(2)
    })

    it("should register tools with requiresConfirmation flag", () => {
        const registry = new ToolRegistry()

        registerAllTools(registry)

        const confirmationTools = registry.getConfirmationTools()
        const safeTools = registry.getSafeTools()

        expect(confirmationTools.length).toBeGreaterThan(0)
        expect(safeTools.length).toBeGreaterThan(0)

        const confirmNames = confirmationTools.map((t) => t.name)
        expect(confirmNames).toContain("edit_lines")
        expect(confirmNames).toContain("create_file")
        expect(confirmNames).toContain("delete_file")
        expect(confirmNames).toContain("git_commit")
    })
})
