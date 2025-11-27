import Parser from "tree-sitter"
import { HardcodedValue, HardcodeType } from "../../domain/value-objects/HardcodedValue"
import { CONFIG_KEYWORDS, DETECTION_VALUES, HARDCODE_TYPES } from "../../shared/constants/rules"
import { AST_STRING_TYPES } from "../../shared/constants/ast-node-types"
import { AstContextChecker } from "./AstContextChecker"
import { ValuePatternMatcher } from "./ValuePatternMatcher"

/**
 * AST-based analyzer for detecting magic strings
 *
 * Analyzes string literal nodes in the AST to determine if they are
 * hardcoded values that should be extracted to constants.
 *
 * Detects various types of hardcoded strings:
 * - URLs and connection strings
 * - Email addresses
 * - IP addresses
 * - File paths
 * - Dates
 * - API keys
 */
export class AstStringAnalyzer {
    private readonly patternMatcher: ValuePatternMatcher

    constructor(private readonly contextChecker: AstContextChecker) {
        this.patternMatcher = new ValuePatternMatcher()
    }

    /**
     * Analyzes a string node and returns a violation if it's a magic string
     */
    public analyze(node: Parser.SyntaxNode, lines: string[]): HardcodedValue | null {
        const stringFragment = node.children.find(
            (child) => child.type === AST_STRING_TYPES.STRING_FRAGMENT,
        )
        if (!stringFragment) {
            return null
        }

        const value = stringFragment.text

        if (value.length <= 3) {
            return null
        }

        if (this.contextChecker.isInExportedConstant(node)) {
            return null
        }

        if (this.contextChecker.isInTypeContext(node)) {
            return null
        }

        if (this.contextChecker.isInImportStatement(node)) {
            return null
        }

        if (this.contextChecker.isInTestDescription(node)) {
            return null
        }

        if (this.contextChecker.isInConsoleCall(node)) {
            return null
        }

        if (this.contextChecker.isInSymbolCall(node)) {
            return null
        }

        if (this.contextChecker.isInTypeofCheck(node)) {
            return null
        }

        if (this.shouldDetect(node, value)) {
            return this.createViolation(node, value, lines)
        }

        return null
    }

    /**
     * Checks if string value should be detected
     */
    private shouldDetect(node: Parser.SyntaxNode, value: string): boolean {
        if (this.patternMatcher.shouldDetect(value)) {
            return true
        }

        if (this.hasConfigurationContext(node)) {
            return true
        }

        return false
    }

    /**
     * Checks if string is in a configuration-related context
     */
    private hasConfigurationContext(node: Parser.SyntaxNode): boolean {
        const context = this.contextChecker.getNodeContext(node).toLowerCase()

        const configKeywords = [
            "url",
            "uri",
            ...CONFIG_KEYWORDS.NETWORK,
            "api",
            ...CONFIG_KEYWORDS.DATABASE,
            "db",
            "env",
            ...CONFIG_KEYWORDS.SECURITY,
            "key",
            ...CONFIG_KEYWORDS.MESSAGES,
            "label",
            ...CONFIG_KEYWORDS.TECHNICAL,
        ]

        return configKeywords.some((keyword) => context.includes(keyword))
    }

    /**
     * Creates a HardcodedValue violation from a string node
     */
    private createViolation(
        node: Parser.SyntaxNode,
        value: string,
        lines: string[],
    ): HardcodedValue {
        const lineNumber = node.startPosition.row + 1
        const column = node.startPosition.column
        const context = lines[node.startPosition.row]?.trim() ?? ""

        const detectedType = this.patternMatcher.detectType(value)
        const valueType =
            detectedType ||
            (this.hasConfigurationContext(node)
                ? DETECTION_VALUES.TYPE_CONFIG
                : DETECTION_VALUES.TYPE_GENERIC)

        return HardcodedValue.create(
            value,
            HARDCODE_TYPES.MAGIC_STRING as HardcodeType,
            lineNumber,
            column,
            context,
            valueType,
        )
    }
}
