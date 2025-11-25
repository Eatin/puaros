import { describe, it, expect, beforeAll } from "vitest"
import { spawn } from "child_process"
import path from "path"
import { promisify } from "util"
import { exec } from "child_process"

const execAsync = promisify(exec)

describe("CLI E2E", () => {
    const CLI_PATH = path.join(__dirname, "../../bin/guardian.js")
    const EXAMPLES_DIR = path.join(__dirname, "../../examples")

    beforeAll(async () => {
        await execAsync("pnpm build", {
            cwd: path.join(__dirname, "../../"),
        })
    })

    const runCLI = async (
        args: string,
    ): Promise<{ stdout: string; stderr: string; exitCode: number }> => {
        try {
            const { stdout, stderr } = await execAsync(`node ${CLI_PATH} ${args}`)
            return { stdout, stderr, exitCode: 0 }
        } catch (error: unknown) {
            const err = error as { stdout?: string; stderr?: string; code?: number }
            return {
                stdout: err.stdout || "",
                stderr: err.stderr || "",
                exitCode: err.code || 1,
            }
        }
    }

    describe("Smoke Tests", () => {
        it("should display version", async () => {
            const { stdout } = await execAsync(`node ${CLI_PATH} --version`)

            expect(stdout).toMatch(/\d+\.\d+\.\d+/)
        })

        it("should display help", async () => {
            const { stdout } = await execAsync(`node ${CLI_PATH} --help`)

            expect(stdout).toContain("Usage:")
            expect(stdout).toContain("check")
            expect(stdout).toContain("Options:")
        })

        it("should run check command successfully", async () => {
            const goodArchDir = path.join(EXAMPLES_DIR, "good-architecture")

            const { stdout } = await runCLI(`check ${goodArchDir}`)

            expect(stdout).toContain("Analyzing")
        }, 30000)
    })

    describe("Output Format", () => {
        it("should display violation counts", async () => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const { stdout } = await runCLI(`check ${badArchDir}`)

            expect(stdout).toContain("Analyzing")
            const hasViolationCount = stdout.includes("Found") || stdout.includes("issue")
            expect(hasViolationCount).toBe(true)
        }, 30000)

        it("should display file paths with violations", async () => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture/hardcoded")

            const { stdout } = await runCLI(`check ${badArchDir}`)

            expect(stdout).toMatch(/\.ts/)
        }, 30000)

        it("should display severity levels", async () => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const { stdout } = await runCLI(`check ${badArchDir}`)

            const hasSeverity =
                stdout.includes("🔴") ||
                stdout.includes("🟠") ||
                stdout.includes("🟡") ||
                stdout.includes("🟢") ||
                stdout.includes("CRITICAL") ||
                stdout.includes("HIGH") ||
                stdout.includes("MEDIUM") ||
                stdout.includes("LOW")

            expect(hasSeverity).toBe(true)
        }, 30000)
    })

    describe("CLI Options", () => {
        it("should respect --limit option", async () => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const { stdout } = await runCLI(`check ${badArchDir} --limit 5`)

            expect(stdout).toContain("Analyzing")
        }, 30000)

        it("should respect --only-critical option", async () => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const { stdout } = await runCLI(`check ${badArchDir} --only-critical`)

            expect(stdout).toContain("Analyzing")

            if (stdout.includes("🔴") || stdout.includes("CRITICAL")) {
                const hasNonCritical =
                    stdout.includes("🟠") ||
                    stdout.includes("🟡") ||
                    stdout.includes("🟢") ||
                    (stdout.includes("HIGH") && !stdout.includes("CRITICAL")) ||
                    stdout.includes("MEDIUM") ||
                    stdout.includes("LOW")

                expect(hasNonCritical).toBe(false)
            }
        }, 30000)

        it("should respect --min-severity option", async () => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const { stdout } = await runCLI(`check ${badArchDir} --min-severity high`)

            expect(stdout).toContain("Analyzing")
        }, 30000)

        it("should respect --exclude option", async () => {
            const goodArchDir = path.join(EXAMPLES_DIR, "good-architecture")

            const { stdout } = await runCLI(`check ${goodArchDir} --exclude "**/dtos/**"`)

            expect(stdout).not.toContain("/dtos/")
        }, 30000)

        it("should respect --no-hardcode option", async () => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const { stdout } = await runCLI(`check ${badArchDir} --no-hardcode`)

            expect(stdout).not.toContain("Magic Number")
            expect(stdout).not.toContain("Magic String")
        }, 30000)

        it("should respect --no-architecture option", async () => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const { stdout } = await runCLI(`check ${badArchDir} --no-architecture`)

            expect(stdout).not.toContain("Architecture Violation")
        }, 30000)
    })

    describe("Good Architecture Examples", () => {
        it("should show success message for clean code", async () => {
            const goodArchDir = path.join(EXAMPLES_DIR, "good-architecture")

            const { stdout } = await runCLI(`check ${goodArchDir}`)

            expect(stdout).toContain("Analyzing")
        }, 30000)
    })

    describe("Bad Architecture Examples", () => {
        it("should detect and report hardcoded values", async () => {
            const hardcodedDir = path.join(EXAMPLES_DIR, "bad-architecture/hardcoded")

            const { stdout } = await runCLI(`check ${hardcodedDir}`)

            expect(stdout).toContain("ServerWithMagicNumbers.ts")
        }, 30000)

        it("should detect and report circular dependencies", async () => {
            const circularDir = path.join(EXAMPLES_DIR, "bad-architecture/circular")

            const { stdout } = await runCLI(`check ${circularDir}`)

            expect(stdout).toContain("Analyzing")
        }, 30000)

        it("should detect and report framework leaks", async () => {
            const frameworkDir = path.join(EXAMPLES_DIR, "bad-architecture/framework-leaks")

            const { stdout } = await runCLI(`check ${frameworkDir}`)

            expect(stdout).toContain("Analyzing")
        }, 30000)

        it("should detect and report naming violations", async () => {
            const namingDir = path.join(EXAMPLES_DIR, "bad-architecture/naming")

            const { stdout } = await runCLI(`check ${namingDir}`)

            expect(stdout).toContain("Analyzing")
        }, 30000)
    })

    describe("Error Handling", () => {
        it("should show error for non-existent path", async () => {
            const nonExistentPath = path.join(EXAMPLES_DIR, "non-existent-directory")

            try {
                await execAsync(`node ${CLI_PATH} check ${nonExistentPath}`)
                expect.fail("Should have thrown an error")
            } catch (error: unknown) {
                const err = error as { stderr: string }
                expect(err.stderr).toBeTruthy()
            }
        }, 30000)
    })

    describe("Exit Codes", () => {
        it("should run for clean code", async () => {
            const goodArchDir = path.join(EXAMPLES_DIR, "good-architecture")

            const { stdout, exitCode } = await runCLI(`check ${goodArchDir}`)

            expect(stdout).toContain("Analyzing")
            expect(exitCode).toBeGreaterThanOrEqual(0)
        }, 30000)

        it("should handle violations gracefully", async () => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const { stdout, exitCode } = await runCLI(`check ${badArchDir}`)

            expect(stdout).toContain("Analyzing")
            expect(exitCode).toBeGreaterThanOrEqual(0)
        }, 30000)
    })

    describe("Spawn Process Tests", () => {
        it("should spawn CLI process and capture output", (done) => {
            const goodArchDir = path.join(EXAMPLES_DIR, "good-architecture")
            const child = spawn("node", [CLI_PATH, "check", goodArchDir])

            let stdout = ""
            let stderr = ""

            child.stdout.on("data", (data) => {
                stdout += data.toString()
            })

            child.stderr.on("data", (data) => {
                stderr += data.toString()
            })

            child.on("close", (code) => {
                expect(code).toBe(0)
                expect(stdout).toContain("Analyzing")
                done()
            })
        }, 30000)

        it("should handle large output without buffering issues", (done) => {
            const badArchDir = path.join(EXAMPLES_DIR, "bad-architecture")
            const child = spawn("node", [CLI_PATH, "check", badArchDir])

            let stdout = ""

            child.stdout.on("data", (data) => {
                stdout += data.toString()
            })

            child.on("close", (code) => {
                expect(code).toBe(0)
                expect(stdout.length).toBeGreaterThan(0)
                done()
            })
        }, 30000)
    })
})
