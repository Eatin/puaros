import { SecretViolation } from "../value-objects/SecretViolation"

/**
 * Interface for detecting hardcoded secrets in source code
 *
 * Detects sensitive data like API keys, tokens, passwords, and credentials
 * that should never be hardcoded in source code. Uses industry-standard
 * Secretlint library for pattern matching.
 *
 * All detected secrets are marked as CRITICAL severity violations.
 *
 * @example
 * ```typescript
 * const detector: ISecretDetector = new SecretDetector()
 * const violations = await detector.detectAll(
 *     'const AWS_KEY = "AKIA1234567890ABCDEF"',
 *     'src/config/aws.ts'
 * )
 *
 * violations.forEach(v => {
 *     console.log(v.getMessage()) // "Hardcoded AWS Access Key detected"
 * })
 * ```
 */
export interface ISecretDetector {
    /**
     * Detect all types of hardcoded secrets in the provided code
     *
     * @param code - Source code to analyze
     * @param filePath - Path to the file being analyzed
     * @returns Array of secret violations found
     */
    detectAll(code: string, filePath: string): Promise<SecretViolation[]>
}
