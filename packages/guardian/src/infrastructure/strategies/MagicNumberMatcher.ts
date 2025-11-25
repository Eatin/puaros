import { HardcodedValue } from "../../domain/value-objects/HardcodedValue"
import { ALLOWED_NUMBERS, DETECTION_KEYWORDS } from "../constants/defaults"
import { HARDCODE_TYPES } from "../../shared/constants"
import { ExportConstantAnalyzer } from "./ExportConstantAnalyzer"

/**
 * Detects magic numbers in code
 *
 * Identifies hardcoded numeric values that should be extracted
 * to constants, excluding allowed values and exported constants.
 */
export class MagicNumberMatcher {
    private readonly numberPatterns = [
        /(?:setTimeout|setInterval)\s*\(\s*[^,]+,\s*(\d+)/g,
        /(?:maxRetries|retries|attempts)\s*[=:]\s*(\d+)/gi,
        /(?:limit|max|min)\s*[=:]\s*(\d+)/gi,
        /(?:port|PORT)\s*[=:]\s*(\d+)/g,
        /(?:delay|timeout|TIMEOUT)\s*[=:]\s*(\d+)/gi,
    ]

    constructor(private readonly exportAnalyzer: ExportConstantAnalyzer) {}

    /**
     * Detects magic numbers in code
     */
    public detect(code: string): HardcodedValue[] {
        const results: HardcodedValue[] = []
        const lines = code.split("\n")

        lines.forEach((line, lineIndex) => {
            if (this.shouldSkipLine(line, lines, lineIndex)) {
                return
            }

            this.detectInPatterns(line, lineIndex, results)
            this.detectGenericNumbers(line, lineIndex, results)
        })

        return results
    }

    /**
     * Checks if line should be skipped
     */
    private shouldSkipLine(line: string, lines: string[], lineIndex: number): boolean {
        if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
            return true
        }

        return this.exportAnalyzer.isInExportedConstant(lines, lineIndex)
    }

    /**
     * Detects numbers in specific patterns
     */
    private detectInPatterns(line: string, lineIndex: number, results: HardcodedValue[]): void {
        this.numberPatterns.forEach((pattern) => {
            let match
            const regex = new RegExp(pattern)

            while ((match = regex.exec(line)) !== null) {
                const value = parseInt(match[1], 10)

                if (!ALLOWED_NUMBERS.has(value)) {
                    results.push(
                        HardcodedValue.create(
                            value,
                            HARDCODE_TYPES.MAGIC_NUMBER,
                            lineIndex + 1,
                            match.index,
                            line.trim(),
                        ),
                    )
                }
            }
        })
    }

    /**
     * Detects generic 3+ digit numbers
     */
    private detectGenericNumbers(line: string, lineIndex: number, results: HardcodedValue[]): void {
        const genericNumberRegex = /\b(\d{3,})\b/g
        let match

        while ((match = genericNumberRegex.exec(line)) !== null) {
            const value = parseInt(match[1], 10)

            if (this.shouldDetectNumber(value, line, match.index)) {
                results.push(
                    HardcodedValue.create(
                        value,
                        HARDCODE_TYPES.MAGIC_NUMBER,
                        lineIndex + 1,
                        match.index,
                        line.trim(),
                    ),
                )
            }
        }
    }

    /**
     * Checks if number should be detected
     */
    private shouldDetectNumber(value: number, line: string, index: number): boolean {
        if (ALLOWED_NUMBERS.has(value)) {
            return false
        }

        if (this.isInComment(line, index)) {
            return false
        }

        if (this.isInString(line, index)) {
            return false
        }

        const context = this.extractContext(line, index)
        return this.looksLikeMagicNumber(context)
    }

    /**
     * Checks if position is in a comment
     */
    private isInComment(line: string, index: number): boolean {
        const beforeIndex = line.substring(0, index)
        return beforeIndex.includes("//") || beforeIndex.includes("/*")
    }

    /**
     * Checks if position is in a string
     */
    private isInString(line: string, index: number): boolean {
        const beforeIndex = line.substring(0, index)
        const singleQuotes = (beforeIndex.match(/'/g) ?? []).length
        const doubleQuotes = (beforeIndex.match(/"/g) ?? []).length
        const backticks = (beforeIndex.match(/`/g) ?? []).length

        return singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0
    }

    /**
     * Extracts context around a position
     */
    private extractContext(line: string, index: number): string {
        const start = Math.max(0, index - 30)
        const end = Math.min(line.length, index + 30)
        return line.substring(start, end)
    }

    /**
     * Checks if context suggests a magic number
     */
    private looksLikeMagicNumber(context: string): boolean {
        const lowerContext = context.toLowerCase()

        const configKeywords = [
            DETECTION_KEYWORDS.TIMEOUT,
            DETECTION_KEYWORDS.DELAY,
            DETECTION_KEYWORDS.RETRY,
            DETECTION_KEYWORDS.LIMIT,
            DETECTION_KEYWORDS.MAX,
            DETECTION_KEYWORDS.MIN,
            DETECTION_KEYWORDS.PORT,
            DETECTION_KEYWORDS.INTERVAL,
        ]

        return configKeywords.some((keyword) => lowerContext.includes(keyword))
    }
}
