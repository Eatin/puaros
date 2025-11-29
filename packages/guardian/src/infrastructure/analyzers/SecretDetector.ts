import { createEngine } from "@secretlint/node"
import type { SecretLintConfigDescriptor } from "@secretlint/types"
import { ISecretDetector } from "../../domain/services/ISecretDetector"
import { SecretViolation } from "../../domain/value-objects/SecretViolation"
import { SECRET_KEYWORDS, SECRET_TYPE_NAMES } from "../../domain/constants/SecretExamples"
import { EXTERNAL_PACKAGES } from "../../shared/constants/rules"

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
                id: EXTERNAL_PACKAGES.SECRETLINT_PRESET,
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
        const lowerMessage = message.toLowerCase()

        const ruleBasedType = this.extractByRuleId(ruleId, lowerMessage)
        if (ruleBasedType) {
            return ruleBasedType
        }

        return this.extractByMessage(lowerMessage)
    }

    private extractByRuleId(ruleId: string, lowerMessage: string): string | null {
        if (ruleId.includes(SECRET_KEYWORDS.AWS)) {
            return this.extractAwsType(lowerMessage)
        }
        if (ruleId.includes(SECRET_KEYWORDS.GITHUB)) {
            return this.extractGithubType(lowerMessage)
        }
        if (ruleId.includes(SECRET_KEYWORDS.NPM)) {
            return SECRET_TYPE_NAMES.NPM_TOKEN
        }
        if (ruleId.includes(SECRET_KEYWORDS.GCP) || ruleId.includes(SECRET_KEYWORDS.GOOGLE)) {
            return SECRET_TYPE_NAMES.GCP_SERVICE_ACCOUNT_KEY
        }
        if (ruleId.includes(SECRET_KEYWORDS.PRIVATEKEY) || ruleId.includes(SECRET_KEYWORDS.SSH)) {
            return this.extractSshType(lowerMessage)
        }
        if (ruleId.includes(SECRET_KEYWORDS.SLACK)) {
            return this.extractSlackType(lowerMessage)
        }
        if (ruleId.includes(SECRET_KEYWORDS.BASICAUTH)) {
            return SECRET_TYPE_NAMES.BASIC_AUTH_CREDENTIALS
        }
        return null
    }

    private extractAwsType(lowerMessage: string): string {
        if (lowerMessage.includes(SECRET_KEYWORDS.ACCESS_KEY)) {
            return SECRET_TYPE_NAMES.AWS_ACCESS_KEY
        }
        if (lowerMessage.includes(SECRET_KEYWORDS.SECRET)) {
            return SECRET_TYPE_NAMES.AWS_SECRET_KEY
        }
        return SECRET_TYPE_NAMES.AWS_CREDENTIAL
    }

    private extractGithubType(lowerMessage: string): string {
        if (lowerMessage.includes(SECRET_KEYWORDS.PERSONAL_ACCESS_TOKEN)) {
            return SECRET_TYPE_NAMES.GITHUB_PERSONAL_ACCESS_TOKEN
        }
        if (lowerMessage.includes(SECRET_KEYWORDS.OAUTH)) {
            return SECRET_TYPE_NAMES.GITHUB_OAUTH_TOKEN
        }
        return SECRET_TYPE_NAMES.GITHUB_TOKEN
    }

    private extractSshType(lowerMessage: string): string {
        const sshTypeMap: [string, string][] = [
            [SECRET_KEYWORDS.RSA, SECRET_TYPE_NAMES.SSH_RSA_PRIVATE_KEY],
            [SECRET_KEYWORDS.DSA, SECRET_TYPE_NAMES.SSH_DSA_PRIVATE_KEY],
            [SECRET_KEYWORDS.ECDSA, SECRET_TYPE_NAMES.SSH_ECDSA_PRIVATE_KEY],
            [SECRET_KEYWORDS.ED25519, SECRET_TYPE_NAMES.SSH_ED25519_PRIVATE_KEY],
        ]
        for (const [keyword, typeName] of sshTypeMap) {
            if (lowerMessage.includes(keyword)) {
                return typeName
            }
        }
        return SECRET_TYPE_NAMES.SSH_PRIVATE_KEY
    }

    private extractSlackType(lowerMessage: string): string {
        if (lowerMessage.includes(SECRET_KEYWORDS.BOT)) {
            return SECRET_TYPE_NAMES.SLACK_BOT_TOKEN
        }
        if (lowerMessage.includes(SECRET_KEYWORDS.USER)) {
            return SECRET_TYPE_NAMES.SLACK_USER_TOKEN
        }
        return SECRET_TYPE_NAMES.SLACK_TOKEN
    }

    private extractByMessage(lowerMessage: string): string {
        const messageTypeMap: [string, string][] = [
            [SECRET_KEYWORDS.API_KEY, SECRET_TYPE_NAMES.API_KEY],
            [SECRET_KEYWORDS.TOKEN, SECRET_TYPE_NAMES.AUTHENTICATION_TOKEN],
            [SECRET_KEYWORDS.PASSWORD, SECRET_TYPE_NAMES.PASSWORD],
            [SECRET_KEYWORDS.SECRET, SECRET_TYPE_NAMES.SECRET],
        ]
        for (const [keyword, typeName] of messageTypeMap) {
            if (lowerMessage.includes(keyword)) {
                return typeName
            }
        }
        return SECRET_TYPE_NAMES.SENSITIVE_DATA
    }
}
