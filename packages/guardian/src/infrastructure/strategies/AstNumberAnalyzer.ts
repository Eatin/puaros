import Parser from "tree-sitter"
import { HardcodedValue, HardcodeType } from "../../domain/value-objects/HardcodedValue"
import { HARDCODE_TYPES } from "../../shared/constants/rules"
import { ALLOWED_NUMBERS, DETECTION_KEYWORDS } from "../constants/defaults"
import { AstContextChecker } from "./AstContextChecker"

/**
 * AST-based analyzer for detecting magic numbers
 *
 * Analyzes number literal nodes in the AST to determine if they are
 * hardcoded values that should be extracted to constants.
 */
export class AstNumberAnalyzer {
    constructor(private readonly contextChecker: AstContextChecker) {}

    /**
     * Analyzes a number node and returns a violation if it's a magic number
     */
    public analyze(node: Parser.SyntaxNode, lines: string[]): HardcodedValue | null {
        const value = parseInt(node.text, 10)

        if (ALLOWED_NUMBERS.has(value)) {
            return null
        }

        if (this.contextChecker.isInExportedConstant(node)) {
            return null
        }

        if (!this.shouldDetect(node, value)) {
            return null
        }

        return this.createViolation(node, value, lines)
    }

    /**
     * Checks if number should be detected based on context
     */
    private shouldDetect(node: Parser.SyntaxNode, value: number): boolean {
        const parent = node.parent
        if (!parent) {
            return false
        }

        if (this.contextChecker.isInCallExpression(parent, ["setTimeout", "setInterval"])) {
            return true
        }

        if (parent.type === "variable_declarator") {
            const identifier = parent.childForFieldName("name")
            if (identifier && this.hasConfigKeyword(identifier.text.toLowerCase())) {
                return true
            }
        }

        if (parent.type === "pair") {
            const key = parent.childForFieldName("key")
            if (key && this.hasConfigKeyword(key.text.toLowerCase())) {
                return true
            }
        }

        if (value >= 100) {
            const context = this.contextChecker.getNodeContext(node)
            return this.looksLikeMagicNumber(context)
        }

        return false
    }

    /**
     * Checks if name contains configuration keywords
     */
    private hasConfigKeyword(name: string): boolean {
        const keywords = [
            DETECTION_KEYWORDS.TIMEOUT,
            DETECTION_KEYWORDS.DELAY,
            DETECTION_KEYWORDS.RETRY,
            DETECTION_KEYWORDS.LIMIT,
            DETECTION_KEYWORDS.MAX,
            DETECTION_KEYWORDS.MIN,
            DETECTION_KEYWORDS.PORT,
            DETECTION_KEYWORDS.INTERVAL,
        ]

        return (
            keywords.some((keyword) => name.includes(keyword)) ||
            name.includes("retries") ||
            name.includes("attempts")
        )
    }

    /**
     * Checks if context suggests a magic number
     */
    private looksLikeMagicNumber(context: string): boolean {
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

        return configKeywords.some((keyword) => context.includes(keyword))
    }

    /**
     * Creates a HardcodedValue violation from a number node
     */
    private createViolation(
        node: Parser.SyntaxNode,
        value: number,
        lines: string[],
    ): HardcodedValue {
        const lineNumber = node.startPosition.row + 1
        const column = node.startPosition.column
        const context = lines[node.startPosition.row]?.trim() ?? ""

        return HardcodedValue.create(
            value,
            HARDCODE_TYPES.MAGIC_NUMBER as HardcodeType,
            lineNumber,
            column,
            context,
        )
    }
}
