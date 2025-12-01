import { describe, it, expect, vi, beforeEach } from "vitest"
import {
    RunTestsTool,
    type RunTestsResult,
    type TestRunner,
} from "../../../../../src/infrastructure/tools/run/RunTestsTool.js"
import type { ToolContext } from "../../../../../src/domain/services/ITool.js"
import type { IStorage } from "../../../../../src/domain/services/IStorage.js"

function createMockStorage(): IStorage {
    return {
        getFile: vi.fn(),
        setFile: vi.fn(),
        deleteFile: vi.fn(),
        getAllFiles: vi.fn().mockResolvedValue(new Map()),
        getFileCount: vi.fn().mockResolvedValue(0),
        getAST: vi.fn(),
        setAST: vi.fn(),
        deleteAST: vi.fn(),
        getAllASTs: vi.fn().mockResolvedValue(new Map()),
        getMeta: vi.fn(),
        setMeta: vi.fn(),
        deleteMeta: vi.fn(),
        getAllMetas: vi.fn().mockResolvedValue(new Map()),
        getSymbolIndex: vi.fn().mockResolvedValue(new Map()),
        setSymbolIndex: vi.fn(),
        getDepsGraph: vi.fn().mockResolvedValue({ imports: new Map(), importedBy: new Map() }),
        setDepsGraph: vi.fn(),
        getProjectConfig: vi.fn(),
        setProjectConfig: vi.fn(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: vi.fn().mockReturnValue(true),
        clear: vi.fn(),
    } as unknown as IStorage
}

function createMockContext(storage?: IStorage): ToolContext {
    return {
        projectRoot: "/test/project",
        storage: storage ?? createMockStorage(),
        requestConfirmation: vi.fn().mockResolvedValue(true),
        onProgress: vi.fn(),
    }
}

type ExecResult = { stdout: string; stderr: string }
type ExecFn = (command: string, options: Record<string, unknown>) => Promise<ExecResult>

function createMockExec(options: {
    stdout?: string
    stderr?: string
    error?: Error & { code?: number; stdout?: string; stderr?: string }
}): ExecFn {
    return vi.fn().mockImplementation(() => {
        if (options.error) {
            return Promise.reject(options.error)
        }
        return Promise.resolve({
            stdout: options.stdout ?? "",
            stderr: options.stderr ?? "",
        })
    })
}

function createMockFsAccess(existingFiles: string[]): typeof import("fs/promises").access {
    return vi.fn().mockImplementation((filePath: string) => {
        for (const file of existingFiles) {
            if (filePath.endsWith(file)) {
                return Promise.resolve()
            }
        }
        return Promise.reject(new Error("ENOENT"))
    })
}

function createMockFsReadFile(
    packageJson?: Record<string, unknown>,
): typeof import("fs/promises").readFile {
    return vi.fn().mockImplementation((filePath: string) => {
        if (filePath.endsWith("package.json") && packageJson) {
            return Promise.resolve(JSON.stringify(packageJson))
        }
        return Promise.reject(new Error("ENOENT"))
    })
}

describe("RunTestsTool", () => {
    let tool: RunTestsTool

    beforeEach(() => {
        tool = new RunTestsTool()
    })

    describe("metadata", () => {
        it("should have correct name", () => {
            expect(tool.name).toBe("run_tests")
        })

        it("should have correct category", () => {
            expect(tool.category).toBe("run")
        })

        it("should not require confirmation", () => {
            expect(tool.requiresConfirmation).toBe(false)
        })

        it("should have correct parameters", () => {
            expect(tool.parameters).toHaveLength(3)
            expect(tool.parameters[0].name).toBe("path")
            expect(tool.parameters[1].name).toBe("filter")
            expect(tool.parameters[2].name).toBe("watch")
        })

        it("should have description", () => {
            expect(tool.description).toContain("test")
            expect(tool.description).toContain("vitest")
        })
    })

    describe("validateParams", () => {
        it("should return null for empty params", () => {
            expect(tool.validateParams({})).toBeNull()
        })

        it("should return null for valid params", () => {
            expect(tool.validateParams({ path: "src", filter: "login", watch: true })).toBeNull()
        })

        it("should return error for invalid path", () => {
            expect(tool.validateParams({ path: 123 })).toContain("path")
        })

        it("should return error for invalid filter", () => {
            expect(tool.validateParams({ filter: 123 })).toContain("filter")
        })

        it("should return error for invalid watch", () => {
            expect(tool.validateParams({ watch: "yes" })).toContain("watch")
        })
    })

    describe("detectTestRunner", () => {
        it("should detect vitest from config file", async () => {
            const fsAccess = createMockFsAccess(["vitest.config.ts"])
            const fsReadFile = createMockFsReadFile()
            const toolWithMocks = new RunTestsTool(undefined, fsAccess, fsReadFile)

            const runner = await toolWithMocks.detectTestRunner("/test/project")

            expect(runner).toBe("vitest")
        })

        it("should detect vitest from .js config", async () => {
            const fsAccess = createMockFsAccess(["vitest.config.js"])
            const fsReadFile = createMockFsReadFile()
            const toolWithMocks = new RunTestsTool(undefined, fsAccess, fsReadFile)

            const runner = await toolWithMocks.detectTestRunner("/test/project")

            expect(runner).toBe("vitest")
        })

        it("should detect vitest from .mts config", async () => {
            const fsAccess = createMockFsAccess(["vitest.config.mts"])
            const fsReadFile = createMockFsReadFile()
            const toolWithMocks = new RunTestsTool(undefined, fsAccess, fsReadFile)

            const runner = await toolWithMocks.detectTestRunner("/test/project")

            expect(runner).toBe("vitest")
        })

        it("should detect jest from config file", async () => {
            const fsAccess = createMockFsAccess(["jest.config.js"])
            const fsReadFile = createMockFsReadFile()
            const toolWithMocks = new RunTestsTool(undefined, fsAccess, fsReadFile)

            const runner = await toolWithMocks.detectTestRunner("/test/project")

            expect(runner).toBe("jest")
        })

        it("should detect vitest from devDependencies", async () => {
            const fsAccess = createMockFsAccess([])
            const fsReadFile = createMockFsReadFile({
                devDependencies: { vitest: "^1.0.0" },
            })
            const toolWithMocks = new RunTestsTool(undefined, fsAccess, fsReadFile)

            const runner = await toolWithMocks.detectTestRunner("/test/project")

            expect(runner).toBe("vitest")
        })

        it("should detect jest from devDependencies", async () => {
            const fsAccess = createMockFsAccess([])
            const fsReadFile = createMockFsReadFile({
                devDependencies: { jest: "^29.0.0" },
            })
            const toolWithMocks = new RunTestsTool(undefined, fsAccess, fsReadFile)

            const runner = await toolWithMocks.detectTestRunner("/test/project")

            expect(runner).toBe("jest")
        })

        it("should detect mocha from devDependencies", async () => {
            const fsAccess = createMockFsAccess([])
            const fsReadFile = createMockFsReadFile({
                devDependencies: { mocha: "^10.0.0" },
            })
            const toolWithMocks = new RunTestsTool(undefined, fsAccess, fsReadFile)

            const runner = await toolWithMocks.detectTestRunner("/test/project")

            expect(runner).toBe("mocha")
        })

        it("should detect npm test script as fallback", async () => {
            const fsAccess = createMockFsAccess([])
            const fsReadFile = createMockFsReadFile({
                scripts: { test: "node test.js" },
            })
            const toolWithMocks = new RunTestsTool(undefined, fsAccess, fsReadFile)

            const runner = await toolWithMocks.detectTestRunner("/test/project")

            expect(runner).toBe("npm")
        })

        it("should return null when no runner found", async () => {
            const fsAccess = createMockFsAccess([])
            const fsReadFile = createMockFsReadFile({})
            const toolWithMocks = new RunTestsTool(undefined, fsAccess, fsReadFile)

            const runner = await toolWithMocks.detectTestRunner("/test/project")

            expect(runner).toBeNull()
        })
    })

    describe("buildCommand", () => {
        describe("vitest", () => {
            it("should build basic vitest command", () => {
                const cmd = tool.buildCommand("vitest")
                expect(cmd).toBe("npx vitest run")
            })

            it("should build vitest with path", () => {
                const cmd = tool.buildCommand("vitest", "src/tests")
                expect(cmd).toBe("npx vitest run src/tests")
            })

            it("should build vitest with filter", () => {
                const cmd = tool.buildCommand("vitest", undefined, "login")
                expect(cmd).toBe('npx vitest run -t "login"')
            })

            it("should build vitest with watch", () => {
                const cmd = tool.buildCommand("vitest", undefined, undefined, true)
                expect(cmd).toBe("npx vitest")
            })

            it("should build vitest with all options", () => {
                const cmd = tool.buildCommand("vitest", "src", "login", true)
                expect(cmd).toBe('npx vitest src -t "login"')
            })
        })

        describe("jest", () => {
            it("should build basic jest command", () => {
                const cmd = tool.buildCommand("jest")
                expect(cmd).toBe("npx jest")
            })

            it("should build jest with path", () => {
                const cmd = tool.buildCommand("jest", "src/tests")
                expect(cmd).toBe("npx jest src/tests")
            })

            it("should build jest with filter", () => {
                const cmd = tool.buildCommand("jest", undefined, "login")
                expect(cmd).toBe('npx jest -t "login"')
            })

            it("should build jest with watch", () => {
                const cmd = tool.buildCommand("jest", undefined, undefined, true)
                expect(cmd).toBe("npx jest --watch")
            })
        })

        describe("mocha", () => {
            it("should build basic mocha command", () => {
                const cmd = tool.buildCommand("mocha")
                expect(cmd).toBe("npx mocha")
            })

            it("should build mocha with path", () => {
                const cmd = tool.buildCommand("mocha", "test/")
                expect(cmd).toBe("npx mocha test/")
            })

            it("should build mocha with filter", () => {
                const cmd = tool.buildCommand("mocha", undefined, "login")
                expect(cmd).toBe('npx mocha --grep "login"')
            })

            it("should build mocha with watch", () => {
                const cmd = tool.buildCommand("mocha", undefined, undefined, true)
                expect(cmd).toBe("npx mocha --watch")
            })
        })

        describe("npm", () => {
            it("should build basic npm test command", () => {
                const cmd = tool.buildCommand("npm")
                expect(cmd).toBe("npm test")
            })

            it("should build npm test with path", () => {
                const cmd = tool.buildCommand("npm", "src/tests")
                expect(cmd).toBe("npm test -- src/tests")
            })

            it("should build npm test with filter", () => {
                const cmd = tool.buildCommand("npm", undefined, "login")
                expect(cmd).toBe('npm test -- "login"')
            })
        })
    })

    describe("execute", () => {
        describe("no runner detected", () => {
            it("should return error when no runner found", async () => {
                const execFn = createMockExec({})
                const fsAccess = createMockFsAccess([])
                const fsReadFile = createMockFsReadFile({})
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({}, ctx)

                expect(result.success).toBe(false)
                expect(result.error).toContain("No test runner detected")
            })
        })

        describe("successful tests", () => {
            it("should return success when tests pass", async () => {
                const execFn = createMockExec({
                    stdout: "All tests passed",
                    stderr: "",
                })
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as RunTestsResult
                expect(data.passed).toBe(true)
                expect(data.exitCode).toBe(0)
                expect(data.runner).toBe("vitest")
                expect(data.stdout).toContain("All tests passed")
            })

            it("should include command in result", async () => {
                const execFn = createMockExec({})
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as RunTestsResult
                expect(data.command).toBe("npx vitest run")
            })

            it("should include duration in result", async () => {
                const execFn = createMockExec({})
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as RunTestsResult
                expect(data.durationMs).toBeGreaterThanOrEqual(0)
            })
        })

        describe("failing tests", () => {
            it("should return success=true but passed=false for test failures", async () => {
                const error = Object.assign(new Error("Tests failed"), {
                    code: 1,
                    stdout: "1 test failed",
                    stderr: "AssertionError",
                })
                const execFn = createMockExec({ error })
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({}, ctx)

                expect(result.success).toBe(true)
                const data = result.data as RunTestsResult
                expect(data.passed).toBe(false)
                expect(data.exitCode).toBe(1)
                expect(data.stdout).toContain("1 test failed")
                expect(data.stderr).toContain("AssertionError")
            })
        })

        describe("with options", () => {
            it("should pass path to command", async () => {
                const execFn = createMockExec({})
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({ path: "src/tests" }, ctx)

                expect(result.success).toBe(true)
                const data = result.data as RunTestsResult
                expect(data.command).toContain("src/tests")
            })

            it("should pass filter to command", async () => {
                const execFn = createMockExec({})
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({ filter: "login" }, ctx)

                expect(result.success).toBe(true)
                const data = result.data as RunTestsResult
                expect(data.command).toContain('-t "login"')
            })

            it("should pass watch option", async () => {
                const execFn = createMockExec({})
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({ watch: true }, ctx)

                expect(result.success).toBe(true)
                const data = result.data as RunTestsResult
                expect(data.command).toBe("npx vitest")
                expect(data.command).not.toContain("run")
            })
        })

        describe("error handling", () => {
            it("should handle timeout", async () => {
                const error = new Error("Command timed out")
                const execFn = createMockExec({ error })
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({}, ctx)

                expect(result.success).toBe(false)
                expect(result.error).toContain("timed out")
            })

            it("should handle generic errors", async () => {
                const error = new Error("Something went wrong")
                const execFn = createMockExec({ error })
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({}, ctx)

                expect(result.success).toBe(false)
                expect(result.error).toBe("Something went wrong")
            })
        })

        describe("exec options", () => {
            it("should run in project root", async () => {
                const execFn = createMockExec({})
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()
                ctx.projectRoot = "/my/project"

                await toolWithMocks.execute({}, ctx)

                expect(execFn).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({ cwd: "/my/project" }),
                )
            })

            it("should set CI environment variable", async () => {
                const execFn = createMockExec({})
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                await toolWithMocks.execute({}, ctx)

                expect(execFn).toHaveBeenCalledWith(
                    expect.any(String),
                    expect.objectContaining({
                        env: expect.objectContaining({ CI: "true" }),
                    }),
                )
            })
        })

        describe("call id", () => {
            it("should generate unique call id", async () => {
                const execFn = createMockExec({})
                const fsAccess = createMockFsAccess(["vitest.config.ts"])
                const fsReadFile = createMockFsReadFile()
                const toolWithMocks = new RunTestsTool(execFn, fsAccess, fsReadFile)
                const ctx = createMockContext()

                const result = await toolWithMocks.execute({}, ctx)

                expect(result.callId).toMatch(/^run_tests-\d+$/)
            })
        })
    })
})
