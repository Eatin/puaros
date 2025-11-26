import Parser from "tree-sitter"
import { HardcodedValue } from "../../domain/value-objects/HardcodedValue"
import { AstBooleanAnalyzer } from "../strategies/AstBooleanAnalyzer"
import { AstConfigObjectAnalyzer } from "../strategies/AstConfigObjectAnalyzer"
import { AstNumberAnalyzer } from "../strategies/AstNumberAnalyzer"
import { AstStringAnalyzer } from "../strategies/AstStringAnalyzer"

/**
 * AST tree traverser for detecting hardcoded values
 *
 * Walks through the Abstract Syntax Tree and uses analyzers
 * to detect hardcoded numbers, strings, booleans, and configuration objects.
 * Also tracks value usage to identify "almost constants" - values used 2+ times.
 */
export class AstTreeTraverser {
    constructor(
        private readonly numberAnalyzer: AstNumberAnalyzer,
        private readonly stringAnalyzer: AstStringAnalyzer,
        private readonly booleanAnalyzer: AstBooleanAnalyzer,
        private readonly configObjectAnalyzer: AstConfigObjectAnalyzer,
    ) {}

    /**
     * Traverses the AST tree and collects hardcoded values
     */
    public traverse(tree: Parser.Tree, sourceCode: string): HardcodedValue[] {
        const results: HardcodedValue[] = []
        const lines = sourceCode.split("\n")
        const cursor = tree.walk()

        this.visit(cursor, lines, results)

        this.markAlmostConstants(results)

        return results
    }

    /**
     * Marks values that appear multiple times in the same file
     */
    private markAlmostConstants(results: HardcodedValue[]): void {
        const valueUsage = new Map<string, number>()

        for (const result of results) {
            const key = `${result.type}:${String(result.value)}`
            valueUsage.set(key, (valueUsage.get(key) || 0) + 1)
        }

        for (let i = 0; i < results.length; i++) {
            const result = results[i]
            const key = `${result.type}:${String(result.value)}`
            const count = valueUsage.get(key) || 0

            if (count >= 2 && !result.withinFileUsageCount) {
                results[i] = HardcodedValue.create(
                    result.value,
                    result.type,
                    result.line,
                    result.column,
                    result.context,
                    result.valueType,
                    result.duplicateLocations,
                    count,
                )
            }
        }
    }

    /**
     * Recursively visits AST nodes
     */
    private visit(cursor: Parser.TreeCursor, lines: string[], results: HardcodedValue[]): void {
        const node = cursor.currentNode

        if (node.type === "object") {
            const violation = this.configObjectAnalyzer.analyze(node, lines)
            if (violation) {
                results.push(violation)
            }
        } else if (node.type === "number") {
            const violation = this.numberAnalyzer.analyze(node, lines)
            if (violation) {
                results.push(violation)
            }
        } else if (node.type === "string") {
            const violation = this.stringAnalyzer.analyze(node, lines)
            if (violation) {
                results.push(violation)
            }
        } else if (node.type === "true" || node.type === "false") {
            const violation = this.booleanAnalyzer.analyze(node, lines)
            if (violation) {
                results.push(violation)
            }
        }

        if (cursor.gotoFirstChild()) {
            do {
                this.visit(cursor, lines, results)
            } while (cursor.gotoNextSibling())
            cursor.gotoParent()
        }
    }
}
