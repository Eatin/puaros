import Parser from "tree-sitter"
import { HardcodedValue, HardcodeType } from "../../domain/value-objects/HardcodedValue"
import { DETECTION_VALUES, HARDCODE_TYPES } from "../../shared/constants/rules"
import { AstContextChecker } from "./AstContextChecker"

/**
 * AST-based analyzer for detecting magic booleans
 *
 * Detects boolean literals used as arguments without clear meaning.
 * Example: doSomething(true, false, true) - hard to understand
 * Better: doSomething({ sync: true, validate: false, cache: true })
 */
export class AstBooleanAnalyzer {
    constructor(private readonly contextChecker: AstContextChecker) {}

    /**
     * Analyzes a boolean node and returns a violation if it's a magic boolean
     */
    public analyze(node: Parser.SyntaxNode, lines: string[]): HardcodedValue | null {
        if (!this.shouldDetect(node)) {
            return null
        }

        const value = node.text === DETECTION_VALUES.BOOLEAN_TRUE

        return this.createViolation(node, value, lines)
    }

    /**
     * Checks if boolean should be detected
     */
    private shouldDetect(node: Parser.SyntaxNode): boolean {
        if (this.contextChecker.isInExportedConstant(node)) {
            return false
        }

        if (this.contextChecker.isInTypeContext(node)) {
            return false
        }

        if (this.contextChecker.isInTestDescription(node)) {
            return false
        }

        const parent = node.parent
        if (!parent) {
            return false
        }

        if (parent.type === "arguments") {
            return this.isInFunctionCallWithMultipleBooleans(parent)
        }

        return false
    }

    /**
     * Checks if function call has multiple boolean arguments
     */
    private isInFunctionCallWithMultipleBooleans(argsNode: Parser.SyntaxNode): boolean {
        let booleanCount = 0

        for (const child of argsNode.children) {
            if (child.type === "true" || child.type === "false") {
                booleanCount++
            }
        }

        return booleanCount >= 2
    }

    /**
     * Creates a HardcodedValue violation from a boolean node
     */
    private createViolation(
        node: Parser.SyntaxNode,
        value: boolean,
        lines: string[],
    ): HardcodedValue {
        const lineNumber = node.startPosition.row + 1
        const column = node.startPosition.column
        const context = lines[node.startPosition.row]?.trim() ?? ""

        return HardcodedValue.create(
            value,
            HARDCODE_TYPES.MAGIC_BOOLEAN as HardcodeType,
            lineNumber,
            column,
            context,
        )
    }
}
