import { exec } from "node:child_process"
import { promisify } from "node:util"
import * as path from "node:path"
import * as fs from "node:fs/promises"
import type { ITool, ToolContext, ToolParameterSchema } from "../../../domain/services/ITool.js"
import {
    createErrorResult,
    createSuccessResult,
    type ToolResult,
} from "../../../domain/value-objects/ToolResult.js"

const execAsync = promisify(exec)

/**
 * Supported test runners.
 */
export type TestRunner = "vitest" | "jest" | "mocha" | "npm"

/**
 * Result data from run_tests tool.
 */
export interface RunTestsResult {
    /** Test runner that was used */
    runner: TestRunner
    /** Command that was executed */
    command: string
    /** Whether all tests passed */
    passed: boolean
    /** Exit code */
    exitCode: number
    /** Standard output */
    stdout: string
    /** Standard error output */
    stderr: string
    /** Execution time in milliseconds */
    durationMs: number
}

/**
 * Default test timeout in milliseconds (5 minutes).
 */
const DEFAULT_TIMEOUT = 300000

/**
 * Maximum output size in characters.
 */
const MAX_OUTPUT_SIZE = 200000

/**
 * Tool for running project tests.
 * Auto-detects test runner (vitest, jest, mocha, npm test).
 */
export class RunTestsTool implements ITool {
    readonly name = "run_tests"
    readonly description =
        "Run the project's test suite. Auto-detects test runner (vitest, jest, npm test). " +
        "Returns test results summary."
    readonly parameters: ToolParameterSchema[] = [
        {
            name: "path",
            type: "string",
            description: "Run tests for specific file or directory",
            required: false,
        },
        {
            name: "filter",
            type: "string",
            description: "Filter tests by name pattern",
            required: false,
        },
        {
            name: "watch",
            type: "boolean",
            description: "Run in watch mode (default: false)",
            required: false,
        },
    ]
    readonly requiresConfirmation = false
    readonly category = "run" as const

    private readonly execFn: typeof execAsync
    private readonly fsAccess: typeof fs.access
    private readonly fsReadFile: typeof fs.readFile

    constructor(
        execFn?: typeof execAsync,
        fsAccess?: typeof fs.access,
        fsReadFile?: typeof fs.readFile,
    ) {
        this.execFn = execFn ?? execAsync
        this.fsAccess = fsAccess ?? fs.access
        this.fsReadFile = fsReadFile ?? fs.readFile
    }

    validateParams(params: Record<string, unknown>): string | null {
        if (params.path !== undefined && typeof params.path !== "string") {
            return "Parameter 'path' must be a string"
        }
        if (params.filter !== undefined && typeof params.filter !== "string") {
            return "Parameter 'filter' must be a string"
        }
        if (params.watch !== undefined && typeof params.watch !== "boolean") {
            return "Parameter 'watch' must be a boolean"
        }
        return null
    }

    async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        const startTime = Date.now()
        const callId = `${this.name}-${String(startTime)}`

        const testPath = params.path as string | undefined
        const filter = params.filter as string | undefined
        const watch = (params.watch as boolean) ?? false

        try {
            const runner = await this.detectTestRunner(ctx.projectRoot)

            if (!runner) {
                return createErrorResult(
                    callId,
                    "No test runner detected. Ensure vitest, jest, or mocha is installed, or 'test' script exists in package.json.",
                    Date.now() - startTime,
                )
            }

            const command = this.buildCommand(runner, testPath, filter, watch)
            const execStartTime = Date.now()

            try {
                const { stdout, stderr } = await this.execFn(command, {
                    cwd: ctx.projectRoot,
                    timeout: DEFAULT_TIMEOUT,
                    maxBuffer: MAX_OUTPUT_SIZE,
                    env: { ...process.env, FORCE_COLOR: "0", CI: "true" },
                })

                const durationMs = Date.now() - execStartTime

                const result: RunTestsResult = {
                    runner,
                    command,
                    passed: true,
                    exitCode: 0,
                    stdout: this.truncateOutput(stdout),
                    stderr: this.truncateOutput(stderr),
                    durationMs,
                }

                return createSuccessResult(callId, result, Date.now() - startTime)
            } catch (error) {
                return this.handleExecError(
                    callId,
                    runner,
                    command,
                    error,
                    execStartTime,
                    startTime,
                )
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return createErrorResult(callId, message, Date.now() - startTime)
        }
    }

    /**
     * Detect which test runner is available in the project.
     */
    async detectTestRunner(projectRoot: string): Promise<TestRunner | null> {
        if (await this.hasFile(projectRoot, "vitest.config.ts")) {
            return "vitest"
        }
        if (await this.hasFile(projectRoot, "vitest.config.js")) {
            return "vitest"
        }
        if (await this.hasFile(projectRoot, "vitest.config.mts")) {
            return "vitest"
        }
        if (await this.hasFile(projectRoot, "jest.config.js")) {
            return "jest"
        }
        if (await this.hasFile(projectRoot, "jest.config.ts")) {
            return "jest"
        }
        if (await this.hasFile(projectRoot, "jest.config.json")) {
            return "jest"
        }

        const packageJsonPath = path.join(projectRoot, "package.json")
        try {
            const content = await this.fsReadFile(packageJsonPath, "utf-8")
            const pkg = JSON.parse(content) as {
                scripts?: Record<string, string>
                devDependencies?: Record<string, string>
                dependencies?: Record<string, string>
            }

            if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) {
                return "vitest"
            }
            if (pkg.devDependencies?.jest || pkg.dependencies?.jest) {
                return "jest"
            }
            if (pkg.devDependencies?.mocha || pkg.dependencies?.mocha) {
                return "mocha"
            }

            if (pkg.scripts?.test) {
                return "npm"
            }
        } catch {
            // package.json doesn't exist or is invalid
        }

        return null
    }

    /**
     * Build the test command based on runner and options.
     */
    buildCommand(runner: TestRunner, testPath?: string, filter?: string, watch?: boolean): string {
        const parts: string[] = []

        switch (runner) {
            case "vitest":
                parts.push("npx vitest")
                if (!watch) {
                    parts.push("run")
                }
                if (testPath) {
                    parts.push(testPath)
                }
                if (filter) {
                    parts.push("-t", `"${filter}"`)
                }
                break

            case "jest":
                parts.push("npx jest")
                if (testPath) {
                    parts.push(testPath)
                }
                if (filter) {
                    parts.push("-t", `"${filter}"`)
                }
                if (watch) {
                    parts.push("--watch")
                }
                break

            case "mocha":
                parts.push("npx mocha")
                if (testPath) {
                    parts.push(testPath)
                }
                if (filter) {
                    parts.push("--grep", `"${filter}"`)
                }
                if (watch) {
                    parts.push("--watch")
                }
                break

            case "npm":
                parts.push("npm test")
                if (testPath || filter) {
                    parts.push("--")
                    if (testPath) {
                        parts.push(testPath)
                    }
                    if (filter) {
                        parts.push(`"${filter}"`)
                    }
                }
                break
        }

        return parts.join(" ")
    }

    /**
     * Check if a file exists.
     */
    private async hasFile(projectRoot: string, filename: string): Promise<boolean> {
        try {
            await this.fsAccess(path.join(projectRoot, filename))
            return true
        } catch {
            return false
        }
    }

    /**
     * Handle exec errors and return appropriate result.
     */
    private handleExecError(
        callId: string,
        runner: TestRunner,
        command: string,
        error: unknown,
        execStartTime: number,
        startTime: number,
    ): ToolResult {
        const durationMs = Date.now() - execStartTime

        if (this.isExecError(error)) {
            const result: RunTestsResult = {
                runner,
                command,
                passed: false,
                exitCode: error.code ?? 1,
                stdout: this.truncateOutput(error.stdout ?? ""),
                stderr: this.truncateOutput(error.stderr ?? error.message),
                durationMs,
            }

            return createSuccessResult(callId, result, Date.now() - startTime)
        }

        if (error instanceof Error) {
            if (error.message.includes("ETIMEDOUT") || error.message.includes("timed out")) {
                return createErrorResult(
                    callId,
                    `Tests timed out after ${String(DEFAULT_TIMEOUT / 1000)} seconds`,
                    Date.now() - startTime,
                )
            }
            return createErrorResult(callId, error.message, Date.now() - startTime)
        }

        return createErrorResult(callId, String(error), Date.now() - startTime)
    }

    /**
     * Type guard for exec error.
     */
    private isExecError(
        error: unknown,
    ): error is Error & { code?: number; stdout?: string; stderr?: string } {
        return error instanceof Error && "code" in error
    }

    /**
     * Truncate output if too large.
     */
    private truncateOutput(output: string): string {
        if (output.length <= MAX_OUTPUT_SIZE) {
            return output
        }
        return `${output.slice(0, MAX_OUTPUT_SIZE)}\n... (output truncated)`
    }
}
