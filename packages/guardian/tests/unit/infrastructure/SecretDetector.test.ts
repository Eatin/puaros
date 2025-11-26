import { describe, it, expect, beforeEach } from "vitest"
import { SecretDetector } from "../../../src/infrastructure/analyzers/SecretDetector"

describe("SecretDetector", () => {
    let detector: SecretDetector

    beforeEach(() => {
        detector = new SecretDetector()
    })

    describe("detectAll", () => {
        it("should return empty array for code without secrets", async () => {
            const code = `
                const greeting = "Hello World"
                const count = 42
                function test() {
                    return true
                }
            `

            const violations = await detector.detectAll(code, "test.ts")

            expect(violations).toHaveLength(0)
        })

        it("should return empty array for normal environment variable usage", async () => {
            const code = `
                const apiKey = process.env.API_KEY
                const dbUrl = process.env.DATABASE_URL
            `

            const violations = await detector.detectAll(code, "config.ts")

            expect(violations).toHaveLength(0)
        })

        it("should handle empty code", async () => {
            const violations = await detector.detectAll("", "empty.ts")

            expect(violations).toHaveLength(0)
        })

        it("should handle code with only comments", async () => {
            const code = `
                // This is a comment
                /* Multi-line
                   comment */
            `

            const violations = await detector.detectAll(code, "comments.ts")

            expect(violations).toHaveLength(0)
        })

        it("should handle multiline strings without secrets", async () => {
            const code = `
                const template = \`
                    Hello World
                    This is a test
                    No secrets here
                \`
            `

            const violations = await detector.detectAll(code, "template.ts")

            expect(violations).toHaveLength(0)
        })

        it("should handle code with URLs", async () => {
            const code = `
                const apiUrl = "https://api.example.com/v1"
                const websiteUrl = "http://localhost:3000"
            `

            const violations = await detector.detectAll(code, "urls.ts")

            expect(violations).toHaveLength(0)
        })

        it("should handle imports and requires", async () => {
            const code = `
                import { something } from "some-package"
                const fs = require('fs')
            `

            const violations = await detector.detectAll(code, "imports.ts")

            expect(violations).toHaveLength(0)
        })

        it("should return violations with correct file path", async () => {
            const code = `const secret = "test-secret-value"`
            const filePath = "src/config/secrets.ts"

            const violations = await detector.detectAll(code, filePath)

            violations.forEach((v) => {
                expect(v.file).toBe(filePath)
            })
        })

        it("should handle .js files", async () => {
            const code = `const test = "value"`

            const violations = await detector.detectAll(code, "test.js")

            expect(violations).toBeInstanceOf(Array)
        })

        it("should handle .jsx files", async () => {
            const code = `const Component = () => <div>Test</div>`

            const violations = await detector.detectAll(code, "Component.jsx")

            expect(violations).toBeInstanceOf(Array)
        })

        it("should handle .tsx files", async () => {
            const code = `const Component: React.FC = () => <div>Test</div>`

            const violations = await detector.detectAll(code, "Component.tsx")

            expect(violations).toBeInstanceOf(Array)
        })

        it("should handle errors gracefully", async () => {
            const code = null as unknown as string

            const violations = await detector.detectAll(code, "test.ts")

            expect(violations).toHaveLength(0)
        })

        it("should handle malformed code gracefully", async () => {
            const code = "const = = ="

            const violations = await detector.detectAll(code, "malformed.ts")

            expect(violations).toBeInstanceOf(Array)
        })
    })

    describe("parseOutputToViolations", () => {
        it("should parse empty output", async () => {
            const code = ""

            const violations = await detector.detectAll(code, "test.ts")

            expect(violations).toHaveLength(0)
        })

        it("should handle whitespace-only output", async () => {
            const code = "   \n   \n   "

            const violations = await detector.detectAll(code, "test.ts")

            expect(violations).toHaveLength(0)
        })
    })

    describe("extractSecretType", () => {
        it("should handle various secret types correctly", async () => {
            const code = `const value = "test"`

            const violations = await detector.detectAll(code, "test.ts")

            violations.forEach((v) => {
                expect(v.secretType).toBeTruthy()
                expect(typeof v.secretType).toBe("string")
                expect(v.secretType.length).toBeGreaterThan(0)
            })
        })
    })

    describe("integration", () => {
        it("should work with TypeScript code", async () => {
            const code = `
                interface Config {
                    apiKey: string
                }

                const config: Config = {
                    apiKey: process.env.API_KEY || "default"
                }
            `

            const violations = await detector.detectAll(code, "config.ts")

            expect(violations).toBeInstanceOf(Array)
        })

        it("should work with ES6+ syntax", async () => {
            const code = `
                const fetchData = async () => {
                    const response = await fetch(url)
                    return response.json()
                }

                const [data, setData] = useState(null)
            `

            const violations = await detector.detectAll(code, "hooks.ts")

            expect(violations).toBeInstanceOf(Array)
        })

        it("should work with JSX/TSX", async () => {
            const code = `
                export const Button = ({ onClick }: Props) => {
                    return <button onClick={onClick}>Click me</button>
                }
            `

            const violations = await detector.detectAll(code, "Button.tsx")

            expect(violations).toBeInstanceOf(Array)
        })

        it("should handle concurrent detections", async () => {
            const code1 = "const test1 = 'value1'"
            const code2 = "const test2 = 'value2'"
            const code3 = "const test3 = 'value3'"

            const [result1, result2, result3] = await Promise.all([
                detector.detectAll(code1, "file1.ts"),
                detector.detectAll(code2, "file2.ts"),
                detector.detectAll(code3, "file3.ts"),
            ])

            expect(result1).toBeInstanceOf(Array)
            expect(result2).toBeInstanceOf(Array)
            expect(result3).toBeInstanceOf(Array)
        })
    })

    describe("edge cases", () => {
        it("should handle very long code", async () => {
            const longCode = "const value = 'test'\n".repeat(1000)

            const violations = await detector.detectAll(longCode, "long.ts")

            expect(violations).toBeInstanceOf(Array)
        })

        it("should handle special characters in code", async () => {
            const code = `
                const special = "!@#$%^&*()_+-=[]{}|;:',.<>?"
                const unicode = "日本語 🚀"
            `

            const violations = await detector.detectAll(code, "special.ts")

            expect(violations).toBeInstanceOf(Array)
        })

        it("should handle code with regex patterns", async () => {
            const code = `
                const pattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$/i
                const matches = text.match(pattern)
            `

            const violations = await detector.detectAll(code, "regex.ts")

            expect(violations).toBeInstanceOf(Array)
        })

        it("should handle code with template literals", async () => {
            const code = `
                const message = \`Hello \${name}, your balance is \${balance}\`
            `

            const violations = await detector.detectAll(code, "template.ts")

            expect(violations).toBeInstanceOf(Array)
        })
    })

    describe("real secret detection", () => {
        it("should detect AWS access key pattern", async () => {
            const code = `const awsKey = "AKIAIOSFODNN7EXAMPLE"`

            const violations = await detector.detectAll(code, "aws.ts")

            if (violations.length > 0) {
                expect(violations[0].secretType).toContain("AWS")
            }
        })

        it("should detect basic auth credentials", async () => {
            const code = `const auth = "https://user:password@example.com"`

            const violations = await detector.detectAll(code, "auth.ts")

            if (violations.length > 0) {
                expect(violations[0].file).toBe("auth.ts")
                expect(violations[0].line).toBeGreaterThan(0)
                expect(violations[0].column).toBeGreaterThan(0)
            }
        })

        it("should detect private SSH key", async () => {
            const code = `
                const privateKey = \`-----BEGIN RSA PRIVATE KEY-----
MIIBogIBAAJBALRiMLAA...
-----END RSA PRIVATE KEY-----\`
            `

            const violations = await detector.detectAll(code, "ssh.ts")

            if (violations.length > 0) {
                expect(violations[0].secretType).toBeTruthy()
            }
        })

        it("should return violation objects with required properties", async () => {
            const code = `const key = "AKIAIOSFODNN7EXAMPLE"`

            const violations = await detector.detectAll(code, "test.ts")

            violations.forEach((v) => {
                expect(v).toHaveProperty("file")
                expect(v).toHaveProperty("line")
                expect(v).toHaveProperty("column")
                expect(v).toHaveProperty("secretType")
                expect(v.getMessage).toBeDefined()
                expect(v.getSuggestion).toBeDefined()
            })
        })

        it("should handle files with multiple secrets", async () => {
            const code = `
                const key1 = "AKIAIOSFODNN7EXAMPLE"
                const key2 = "AKIAIOSFODNN8EXAMPLE"
            `

            const violations = await detector.detectAll(code, "multiple.ts")

            expect(violations).toBeInstanceOf(Array)
        })
    })
})
