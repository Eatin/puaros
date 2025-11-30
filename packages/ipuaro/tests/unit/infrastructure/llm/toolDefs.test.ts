import { describe, it, expect } from "vitest"
import {
    ALL_TOOLS,
    READ_TOOLS,
    EDIT_TOOLS,
    SEARCH_TOOLS,
    ANALYSIS_TOOLS,
    GIT_TOOLS,
    RUN_TOOLS,
    CONFIRMATION_TOOLS,
    requiresConfirmation,
    getToolDef,
    getToolsByCategory,
    GET_LINES_TOOL,
    GET_FUNCTION_TOOL,
    GET_CLASS_TOOL,
    GET_STRUCTURE_TOOL,
    EDIT_LINES_TOOL,
    CREATE_FILE_TOOL,
    DELETE_FILE_TOOL,
    FIND_REFERENCES_TOOL,
    FIND_DEFINITION_TOOL,
    GET_DEPENDENCIES_TOOL,
    GET_DEPENDENTS_TOOL,
    GET_COMPLEXITY_TOOL,
    GET_TODOS_TOOL,
    GIT_STATUS_TOOL,
    GIT_DIFF_TOOL,
    GIT_COMMIT_TOOL,
    RUN_COMMAND_TOOL,
    RUN_TESTS_TOOL,
} from "../../../../src/infrastructure/llm/toolDefs.js"

describe("toolDefs", () => {
    describe("ALL_TOOLS", () => {
        it("should contain exactly 18 tools", () => {
            expect(ALL_TOOLS).toHaveLength(18)
        })

        it("should have unique tool names", () => {
            const names = ALL_TOOLS.map((t) => t.name)
            const uniqueNames = new Set(names)
            expect(uniqueNames.size).toBe(18)
        })

        it("should have valid structure for all tools", () => {
            for (const tool of ALL_TOOLS) {
                expect(tool.name).toBeDefined()
                expect(typeof tool.name).toBe("string")
                expect(tool.description).toBeDefined()
                expect(typeof tool.description).toBe("string")
                expect(Array.isArray(tool.parameters)).toBe(true)
            }
        })
    })

    describe("READ_TOOLS", () => {
        it("should contain 4 read tools", () => {
            expect(READ_TOOLS).toHaveLength(4)
        })

        it("should include all read tools", () => {
            expect(READ_TOOLS).toContain(GET_LINES_TOOL)
            expect(READ_TOOLS).toContain(GET_FUNCTION_TOOL)
            expect(READ_TOOLS).toContain(GET_CLASS_TOOL)
            expect(READ_TOOLS).toContain(GET_STRUCTURE_TOOL)
        })
    })

    describe("EDIT_TOOLS", () => {
        it("should contain 3 edit tools", () => {
            expect(EDIT_TOOLS).toHaveLength(3)
        })

        it("should include all edit tools", () => {
            expect(EDIT_TOOLS).toContain(EDIT_LINES_TOOL)
            expect(EDIT_TOOLS).toContain(CREATE_FILE_TOOL)
            expect(EDIT_TOOLS).toContain(DELETE_FILE_TOOL)
        })
    })

    describe("SEARCH_TOOLS", () => {
        it("should contain 2 search tools", () => {
            expect(SEARCH_TOOLS).toHaveLength(2)
        })

        it("should include all search tools", () => {
            expect(SEARCH_TOOLS).toContain(FIND_REFERENCES_TOOL)
            expect(SEARCH_TOOLS).toContain(FIND_DEFINITION_TOOL)
        })
    })

    describe("ANALYSIS_TOOLS", () => {
        it("should contain 4 analysis tools", () => {
            expect(ANALYSIS_TOOLS).toHaveLength(4)
        })

        it("should include all analysis tools", () => {
            expect(ANALYSIS_TOOLS).toContain(GET_DEPENDENCIES_TOOL)
            expect(ANALYSIS_TOOLS).toContain(GET_DEPENDENTS_TOOL)
            expect(ANALYSIS_TOOLS).toContain(GET_COMPLEXITY_TOOL)
            expect(ANALYSIS_TOOLS).toContain(GET_TODOS_TOOL)
        })
    })

    describe("GIT_TOOLS", () => {
        it("should contain 3 git tools", () => {
            expect(GIT_TOOLS).toHaveLength(3)
        })

        it("should include all git tools", () => {
            expect(GIT_TOOLS).toContain(GIT_STATUS_TOOL)
            expect(GIT_TOOLS).toContain(GIT_DIFF_TOOL)
            expect(GIT_TOOLS).toContain(GIT_COMMIT_TOOL)
        })
    })

    describe("RUN_TOOLS", () => {
        it("should contain 2 run tools", () => {
            expect(RUN_TOOLS).toHaveLength(2)
        })

        it("should include all run tools", () => {
            expect(RUN_TOOLS).toContain(RUN_COMMAND_TOOL)
            expect(RUN_TOOLS).toContain(RUN_TESTS_TOOL)
        })
    })

    describe("individual tool definitions", () => {
        describe("GET_LINES_TOOL", () => {
            it("should have correct name", () => {
                expect(GET_LINES_TOOL.name).toBe("get_lines")
            })

            it("should have required path parameter", () => {
                const pathParam = GET_LINES_TOOL.parameters.find((p) => p.name === "path")
                expect(pathParam).toBeDefined()
                expect(pathParam?.required).toBe(true)
            })

            it("should have optional start and end parameters", () => {
                const startParam = GET_LINES_TOOL.parameters.find((p) => p.name === "start")
                const endParam = GET_LINES_TOOL.parameters.find((p) => p.name === "end")
                expect(startParam?.required).toBe(false)
                expect(endParam?.required).toBe(false)
            })
        })

        describe("EDIT_LINES_TOOL", () => {
            it("should have all required parameters", () => {
                const requiredParams = EDIT_LINES_TOOL.parameters.filter((p) => p.required)
                const names = requiredParams.map((p) => p.name)
                expect(names).toContain("path")
                expect(names).toContain("start")
                expect(names).toContain("end")
                expect(names).toContain("content")
            })
        })

        describe("GIT_STATUS_TOOL", () => {
            it("should have no required parameters", () => {
                expect(GIT_STATUS_TOOL.parameters).toHaveLength(0)
            })
        })

        describe("GET_TODOS_TOOL", () => {
            it("should have enum for type parameter", () => {
                const typeParam = GET_TODOS_TOOL.parameters.find((p) => p.name === "type")
                expect(typeParam?.enum).toEqual(["TODO", "FIXME", "HACK", "XXX"])
            })
        })
    })

    describe("CONFIRMATION_TOOLS", () => {
        it("should be a Set", () => {
            expect(CONFIRMATION_TOOLS instanceof Set).toBe(true)
        })

        it("should contain edit and git_commit tools", () => {
            expect(CONFIRMATION_TOOLS.has("edit_lines")).toBe(true)
            expect(CONFIRMATION_TOOLS.has("create_file")).toBe(true)
            expect(CONFIRMATION_TOOLS.has("delete_file")).toBe(true)
            expect(CONFIRMATION_TOOLS.has("git_commit")).toBe(true)
        })

        it("should not contain read tools", () => {
            expect(CONFIRMATION_TOOLS.has("get_lines")).toBe(false)
            expect(CONFIRMATION_TOOLS.has("get_function")).toBe(false)
        })
    })

    describe("requiresConfirmation", () => {
        it("should return true for edit tools", () => {
            expect(requiresConfirmation("edit_lines")).toBe(true)
            expect(requiresConfirmation("create_file")).toBe(true)
            expect(requiresConfirmation("delete_file")).toBe(true)
        })

        it("should return true for git_commit", () => {
            expect(requiresConfirmation("git_commit")).toBe(true)
        })

        it("should return false for read tools", () => {
            expect(requiresConfirmation("get_lines")).toBe(false)
            expect(requiresConfirmation("get_function")).toBe(false)
            expect(requiresConfirmation("get_structure")).toBe(false)
        })

        it("should return false for analysis tools", () => {
            expect(requiresConfirmation("get_dependencies")).toBe(false)
            expect(requiresConfirmation("get_complexity")).toBe(false)
        })

        it("should return false for unknown tools", () => {
            expect(requiresConfirmation("unknown_tool")).toBe(false)
        })
    })

    describe("getToolDef", () => {
        it("should return tool definition by name", () => {
            const tool = getToolDef("get_lines")
            expect(tool).toBe(GET_LINES_TOOL)
        })

        it("should return undefined for unknown tool", () => {
            const tool = getToolDef("unknown_tool")
            expect(tool).toBeUndefined()
        })

        it("should find all 18 tools", () => {
            const names = [
                "get_lines",
                "get_function",
                "get_class",
                "get_structure",
                "edit_lines",
                "create_file",
                "delete_file",
                "find_references",
                "find_definition",
                "get_dependencies",
                "get_dependents",
                "get_complexity",
                "get_todos",
                "git_status",
                "git_diff",
                "git_commit",
                "run_command",
                "run_tests",
            ]

            for (const name of names) {
                expect(getToolDef(name)).toBeDefined()
            }
        })
    })

    describe("getToolsByCategory", () => {
        it("should return read tools", () => {
            expect(getToolsByCategory("read")).toBe(READ_TOOLS)
        })

        it("should return edit tools", () => {
            expect(getToolsByCategory("edit")).toBe(EDIT_TOOLS)
        })

        it("should return search tools", () => {
            expect(getToolsByCategory("search")).toBe(SEARCH_TOOLS)
        })

        it("should return analysis tools", () => {
            expect(getToolsByCategory("analysis")).toBe(ANALYSIS_TOOLS)
        })

        it("should return git tools", () => {
            expect(getToolsByCategory("git")).toBe(GIT_TOOLS)
        })

        it("should return run tools", () => {
            expect(getToolsByCategory("run")).toBe(RUN_TOOLS)
        })

        it("should return empty array for unknown category", () => {
            expect(getToolsByCategory("unknown")).toEqual([])
        })
    })
})
