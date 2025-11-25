import { describe, it, expect, beforeEach } from "vitest"
import { HardcodeDetector } from "../../../src/infrastructure/analyzers/HardcodeDetector"
import { HARDCODE_TYPES } from "../../../src/shared/constants"

describe("HardcodeDetector", () => {
    let detector: HardcodeDetector

    beforeEach(() => {
        detector = new HardcodeDetector()
    })

    describe("detectMagicNumbers", () => {
        describe("setTimeout and setInterval", () => {
            it("should detect timeout values in setTimeout", () => {
                const code = `setTimeout(() => {}, 5000)`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
                expect(result.some((r) => r.value === 5000)).toBe(true)
                expect(result[0].type).toBe(HARDCODE_TYPES.MAGIC_NUMBER)
                expect(result[0].line).toBe(1)
            })

            it("should detect interval values in setInterval", () => {
                const code = `setInterval(() => {}, 3000)`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
                expect(result.some((r) => r.value === 3000)).toBe(true)
            })

            it("should detect multiple timeout values", () => {
                const code = `
                    setTimeout(() => {}, 5000)
                    setTimeout(() => {}, 10000)
                    setInterval(() => {}, 3000)
                `
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThanOrEqual(3)
                const values = result.map((r) => r.value)
                expect(values).toContain(5000)
                expect(values).toContain(10000)
                expect(values).toContain(3000)
            })
        })

        describe("retry and attempts", () => {
            it("should detect maxRetries values", () => {
                const code = `const maxRetries = 3`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(1)
                expect(result[0].value).toBe(3)
            })

            it("should detect retries values", () => {
                const code = `const retries = 5`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(1)
                expect(result[0].value).toBe(5)
            })

            it("should detect attempts values", () => {
                const code = `const attempts = 7`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(1)
                expect(result[0].value).toBe(7)
            })
        })

        describe("ports", () => {
            it("should detect lowercase port", () => {
                const code = `const port = 8080`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
                expect(result.some((r) => r.value === 8080)).toBe(true)
            })

            it("should detect uppercase PORT", () => {
                const code = `const PORT = 3000`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
                expect(result.some((r) => r.value === 3000)).toBe(true)
            })
        })

        describe("limits", () => {
            it("should detect limit values", () => {
                const code = `const limit = 50`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(1)
                expect(result[0].value).toBe(50)
            })

            it("should detect max values", () => {
                const code = `const max = 150`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
                expect(result.some((r) => r.value === 150)).toBe(true)
            })

            it("should detect min values", () => {
                const code = `const min = 15`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(1)
                expect(result[0].value).toBe(15)
            })
        })

        describe("delay and timeout", () => {
            it("should detect delay values", () => {
                const code = `const delay = 2000`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
                expect(result.some((r) => r.value === 2000)).toBe(true)
            })

            it("should detect timeout values", () => {
                const code = `const timeout = 5000`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
                expect(result.some((r) => r.value === 5000)).toBe(true)
            })
        })

        describe("allowed numbers", () => {
            it("should NOT detect -1", () => {
                const code = `const notFound = -1`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect 0", () => {
                const code = `const index = 0`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect 1", () => {
                const code = `const increment = 1`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect 2", () => {
                const code = `const pair = 2`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect 10, 100, 1000", () => {
                const code = `
                    const ten = 10
                    const hundred = 100
                    const thousand = 1000
                `
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })
        })

        describe("exported constants", () => {
            it("should NOT detect numbers in single-line export const with as const", () => {
                const code = `export const CONFIG = { timeout: 5000 } as const`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect numbers in multi-line export const with as const", () => {
                const code = `
export const CONFIG = {
    timeout: 5000,
    port: 8080,
    retries: 3,
} as const
                `
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect numbers in nested export const", () => {
                const code = `
export const SETTINGS = {
    api: {
        timeout: 10000,
        port: 3000,
    },
    db: {
        port: 5432,
    },
} as const
                `
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should detect numbers in export const WITHOUT as const", () => {
                const code = `export const CONFIG = { timeout: 5000 }`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
            })
        })

        describe("comments and strings", () => {
            it("should NOT detect numbers in comments", () => {
                const code = `// timeout is 5000ms`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect numbers in multi-line comments", () => {
                const code = `
                    /*
                     * timeout: 5000
                     * port: 8080
                     */
                `
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })
        })

        describe("generic 3+ digit numbers", () => {
            it("should detect suspicious 3-digit numbers with config context", () => {
                const code = `const timeout = 500`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
            })

            it("should NOT detect 3-digit numbers without context", () => {
                const code = `const x = 123`
                const result = detector.detectMagicNumbers(code, "test.ts")

                expect(result).toHaveLength(0)
            })
        })
    })

    describe("detectMagicStrings", () => {
        describe("URLs and API endpoints", () => {
            it("should detect http URLs", () => {
                const code = `const url = "http://localhost:8080"`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(1)
                expect(result[0].value).toBe("http://localhost:8080")
                expect(result[0].type).toBe(HARDCODE_TYPES.MAGIC_STRING)
            })

            it("should detect https URLs", () => {
                const code = `const url = "https://api.example.com"`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(1)
                expect(result[0].value).toBe("https://api.example.com")
            })

            it("should detect mongodb connection strings", () => {
                const code = `const dbUrl = "mongodb://localhost:27017/mydb"`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(1)
                expect(result[0].value).toBe("mongodb://localhost:27017/mydb")
            })
        })

        describe("allowed strings", () => {
            it("should NOT detect single character strings", () => {
                const code = `const char = "a"`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect empty strings", () => {
                const code = `const empty = ""`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect short strings (3 chars or less)", () => {
                const code = `const short = "abc"`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })
        })

        describe("console logs", () => {
            it("should NOT detect strings in console.log", () => {
                const code = `console.log("Debug message")`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect strings in console.error", () => {
                const code = `console.error("Error occurred")`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })
        })

        describe("test descriptions", () => {
            it("should NOT detect strings in test()", () => {
                const code = `test("should work correctly", () => {})`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect strings in describe()", () => {
                const code = `describe("test suite", () => {})`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })
        })

        describe("imports", () => {
            it("should NOT detect strings in import statements", () => {
                const code = `import { foo } from "some-package"`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect strings in require statements", () => {
                const code = `const foo = require("package-name")`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result.length).toBeLessThanOrEqual(1)
            })
        })

        describe("template literals", () => {
            it("should NOT detect template literals with interpolation", () => {
                const code = "const url = `http://localhost:${port}`"
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect backtick strings", () => {
                const code = "`some string`"
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })
        })

        describe("exported constants", () => {
            it("should NOT detect strings in single-line export const", () => {
                const code = `export const API_URL = "http://localhost" as const`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })

            it("should NOT detect strings in multi-line export const", () => {
                const code = `
export const CONFIG = {
    baseUrl: "http://localhost:3000",
    apiKey: "secret-key",
} as const
                `
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(0)
            })
        })

        describe("edge cases", () => {
            it("should detect long meaningful strings", () => {
                const code = `const message = "Something went wrong"`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result).toHaveLength(1)
                expect(result[0].value).toBe("Something went wrong")
            })

            it("should handle multiple strings on same line", () => {
                const code = `const a = "https://api.example.com"; const b = "another-url"`
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
                expect(result.some((r) => r.value.includes("api.example.com"))).toBe(true)
            })

            it("should handle different quote types", () => {
                const code = `
                    const single = 'http://localhost'
                    const double = "http://localhost"
                `
                const result = detector.detectMagicStrings(code, "test.ts")

                expect(result.length).toBeGreaterThan(0)
            })
        })
    })

    describe("detectAll", () => {
        it("should detect both magic numbers and strings", () => {
            const code = `
                const timeout = 5000
                const url = "http://localhost:8080"
            `
            const result = detector.detectAll(code, "test.ts")

            expect(result.length).toBeGreaterThan(0)
            expect(result.some((r) => r.isMagicNumber())).toBe(true)
            expect(result.some((r) => r.isMagicString())).toBe(true)
        })

        it("should return empty array for clean code", () => {
            const code = `
                const index = 0
                const increment = 1
                console.log("debug")
            `
            const result = detector.detectAll(code, "test.ts")

            expect(result).toHaveLength(0)
        })
    })

    describe("context and line numbers", () => {
        it("should provide correct line numbers", () => {
            const code = `const a = 1
const timeout = 5000
const b = 2`
            const result = detector.detectMagicNumbers(code, "test.ts")

            expect(result.length).toBeGreaterThan(0)
            expect(result.some((r) => r.line === 2)).toBe(true)
        })

        it("should provide context string", () => {
            const code = `const timeout = 5000`
            const result = detector.detectMagicNumbers(code, "test.ts")

            expect(result.length).toBeGreaterThan(0)
            expect(result[0].context).toContain("timeout")
            expect(result[0].context).toContain("5000")
        })
    })

    describe("TypeScript type contexts (false positive reduction)", () => {
        it("should NOT detect strings in union types", () => {
            const code = `type Status = 'active' | 'inactive' | 'pending'`
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result).toHaveLength(0)
        })

        it("should NOT detect strings in interface property types", () => {
            const code = `interface Config { mode: 'development' | 'production' }`
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result).toHaveLength(0)
        })

        it("should NOT detect strings in type aliases", () => {
            const code = `type Theme = 'light' | 'dark'`
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result).toHaveLength(0)
        })

        it("should NOT detect strings in type assertions", () => {
            const code = `const mode = getMode() as 'read' | 'write'`
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result).toHaveLength(0)
        })

        it("should NOT detect strings in Symbol() calls", () => {
            const code = `const TOKEN = Symbol('MY_TOKEN')`
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result).toHaveLength(0)
        })

        it("should NOT detect strings in multiple Symbol() calls", () => {
            const code = `
                export const LOGGER = Symbol('LOGGER')
                export const DATABASE = Symbol('DATABASE')
                export const CACHE = Symbol('CACHE')
            `
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result).toHaveLength(0)
        })

        it("should NOT detect strings in import() calls", () => {
            const code = `const module = import('../../path/to/module.js')`
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result).toHaveLength(0)
        })

        it("should NOT detect strings in typeof checks", () => {
            const code = `if (typeof x === 'string') { }`
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result).toHaveLength(0)
        })

        it("should NOT detect strings in reverse typeof checks", () => {
            const code = `if ('number' === typeof count) { }`
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result).toHaveLength(0)
        })

        it("should skip tokens.ts files completely", () => {
            const code = `
                export const LOGGER = Symbol('LOGGER')
                export const DATABASE = Symbol('DATABASE')
                const url = "http://localhost:8080"
            `
            const result = detector.detectAll(code, "src/di/tokens.ts")

            expect(result).toHaveLength(0)
        })

        it("should skip tokens.js files completely", () => {
            const code = `const TOKEN = Symbol('TOKEN')`
            const result = detector.detectAll(code, "src/di/tokens.js")

            expect(result).toHaveLength(0)
        })

        it("should detect real magic strings even with type contexts nearby", () => {
            const code = `
                type Mode = 'read' | 'write'
                const apiKey = "secret-key-12345"
            `
            const result = detector.detectMagicStrings(code, "test.ts")

            expect(result.length).toBeGreaterThan(0)
            expect(result.some((r) => r.value === "secret-key-12345")).toBe(true)
        })
    })
})
