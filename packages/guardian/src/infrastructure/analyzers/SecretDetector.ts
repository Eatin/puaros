import { createEngine } from "@secretlint/node"
import type { SecretLintConfigDescriptor } from "@secretlint/types"
import { ISecretDetector } from "../../domain/services/ISecretDetector"
import { SecretViolation } from "../../domain/value-objects/SecretViolation"

/**
 * Detects hardcoded secrets in TypeScript/JavaScript code
 *
 * Uses industry-standard Secretlint library to detect 350+ types of secrets
 * including AWS keys, GitHub tokens, NPM tokens, SSH keys, API keys, and more.
 *
 * All detected secrets are marked as CRITICAL severity because they represent
 * serious security risks that could lead to unauthorized access or data breaches.
 *
 * @example
 * ```typescript
 * const detector = new SecretDetector()
 * const code = `const AWS_KEY = "AKIA1234567890ABCDEF"`
 * const violations = await detector.detectAll(code, 'config.ts')
 * // Returns array of SecretViolation objects with CRITICAL severity
 * ```
 */
export class SecretDetector implements ISecretDetector {
    private readonly secretlintConfig: SecretLintConfigDescriptor = {
        rules: [
            {
                id: "@secretlint/secretlint-rule-preset-recommend",
            },
        ],
    }

    /**
     * Detects all types of hardcoded secrets in the provided code
     *
     * @param code - Source code to analyze
     * @param filePath - Path to the file being analyzed
     * @returns Promise resolving to array of secret violations
     */
    public async detectAll(code: string, filePath: string): Promise<SecretViolation[]> {
        try {
            const engine = await createEngine({
                cwd: process.cwd(),
                configFileJSON: this.secretlintConfig,
                formatter: "stylish",
                color: false,
            })

            const result = await engine.executeOnContent({
                content: code,
                filePath,
            })

            return this.parseOutputToViolations(result.output, filePath)
        } catch (_error) {
            return []
        }
    }

    private parseOutputToViolations(output: string, filePath: string): SecretViolation[] {
        const violations: SecretViolation[] = []

        if (!output || output.trim() === "") {
            return violations
        }

        const lines = output.split("\n")

        for (const line of lines) {
            const match = /^\s*(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+(.+)$/.exec(line)

            if (match) {
                const [, lineNum, column, , message, ruleId] = match
                const secretType = this.extractSecretType(message, ruleId)

                const violation = SecretViolation.create(
                    filePath,
                    parseInt(lineNum, 10),
                    parseInt(column, 10),
                    secretType,
                    message,
                )

                violations.push(violation)
            }
        }

        return violations
    }

    private extractSecretType(message: string, ruleId: string): string {
        if (ruleId.includes("aws")) {
            if (message.toLowerCase().includes("access key")) {
                return "AWS Access Key"
            }
            if (message.toLowerCase().includes("secret")) {
                return "AWS Secret Key"
            }
            return "AWS Credential"
        }

        if (ruleId.includes("github")) {
            if (message.toLowerCase().includes("personal access token")) {
                return "GitHub Personal Access Token"
            }
            if (message.toLowerCase().includes("oauth")) {
                return "GitHub OAuth Token"
            }
            return "GitHub Token"
        }

        if (ruleId.includes("npm")) {
            return "NPM Token"
        }

        if (ruleId.includes("gcp") || ruleId.includes("google")) {
            return "GCP Service Account Key"
        }

        if (ruleId.includes("privatekey") || ruleId.includes("ssh")) {
            if (message.toLowerCase().includes("rsa")) {
                return "SSH RSA Private Key"
            }
            if (message.toLowerCase().includes("dsa")) {
                return "SSH DSA Private Key"
            }
            if (message.toLowerCase().includes("ecdsa")) {
                return "SSH ECDSA Private Key"
            }
            if (message.toLowerCase().includes("ed25519")) {
                return "SSH Ed25519 Private Key"
            }
            return "SSH Private Key"
        }

        if (ruleId.includes("slack")) {
            if (message.toLowerCase().includes("bot")) {
                return "Slack Bot Token"
            }
            if (message.toLowerCase().includes("user")) {
                return "Slack User Token"
            }
            return "Slack Token"
        }

        if (ruleId.includes("basicauth")) {
            return "Basic Authentication Credentials"
        }

        if (message.toLowerCase().includes("api key")) {
            return "API Key"
        }

        if (message.toLowerCase().includes("token")) {
            return "Authentication Token"
        }

        if (message.toLowerCase().includes("password")) {
            return "Password"
        }

        if (message.toLowerCase().includes("secret")) {
            return "Secret"
        }

        return "Sensitive Data"
    }
}
