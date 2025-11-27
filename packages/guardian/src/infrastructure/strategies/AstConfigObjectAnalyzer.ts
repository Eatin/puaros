import Parser from "tree-sitter"
import { HardcodedValue, HardcodeType } from "../../domain/value-objects/HardcodedValue"
import { HARDCODE_TYPES } from "../../shared/constants/rules"
import { AST_STRING_TYPES } from "../../shared/constants/ast-node-types"
import { ALLOWED_NUMBERS } from "../constants/defaults"
import { AstContextChecker } from "./AstContextChecker"

/**
 * AST-based analyzer for detecting configuration objects with hardcoded values
 *
 * Detects objects that contain multiple hardcoded values that should be
 * extracted to a configuration file.
 *
 * Example:
 * const config = { timeout: 5000, retries: 3, url: "http://..." }
 */
export class AstConfigObjectAnalyzer {
    private readonly MIN_HARDCODED_VALUES = 2

    constructor(private readonly contextChecker: AstContextChecker) {}

    /**
     * Analyzes an object expression and returns a violation if it contains many hardcoded values
     */
    public analyze(node: Parser.SyntaxNode, lines: string[]): HardcodedValue | null {
        if (node.type !== "object") {
            return null
        }

        if (this.contextChecker.isInExportedConstant(node)) {
            return null
        }

        if (this.contextChecker.isInTypeContext(node)) {
            return null
        }

        const hardcodedCount = this.countHardcodedValues(node)

        if (hardcodedCount < this.MIN_HARDCODED_VALUES) {
            return null
        }

        return this.createViolation(node, hardcodedCount, lines)
    }

    /**
     * Counts hardcoded values in an object
     */
    private countHardcodedValues(objectNode: Parser.SyntaxNode): number {
        let count = 0

        for (const child of objectNode.children) {
            if (child.type === "pair") {
                const value = child.childForFieldName("value")
                if (value && this.isHardcodedValue(value)) {
                    count++
                }
            }
        }

        return count
    }

    /**
     * Checks if a node is a hardcoded value
     */
    private isHardcodedValue(node: Parser.SyntaxNode): boolean {
        if (node.type === "number") {
            const value = parseInt(node.text, 10)
            return !ALLOWED_NUMBERS.has(value) && value >= 100
        }

        if (node.type === "string") {
            const stringFragment = node.children.find(
                (c) => c.type === AST_STRING_TYPES.STRING_FRAGMENT,
            )
            return stringFragment !== undefined && stringFragment.text.length > 3
        }

        return false
    }

    /**
     * Creates a HardcodedValue violation for a config object
     */
    private createViolation(
        node: Parser.SyntaxNode,
        hardcodedCount: number,
        lines: string[],
    ): HardcodedValue {
        const lineNumber = node.startPosition.row + 1
        const column = node.startPosition.column
        const context = lines[node.startPosition.row]?.trim() ?? ""

        const objectPreview = this.getObjectPreview(node)

        return HardcodedValue.create(
            `Configuration object with ${String(hardcodedCount)} hardcoded values: ${objectPreview}`,
            HARDCODE_TYPES.MAGIC_CONFIG as HardcodeType,
            lineNumber,
            column,
            context,
        )
    }

    /**
     * Gets a preview of the object for the violation message
     */
    private getObjectPreview(node: Parser.SyntaxNode): string {
        const text = node.text
        if (text.length <= 50) {
            return text
        }
        return `${text.substring(0, 47)}...`
    }
}
