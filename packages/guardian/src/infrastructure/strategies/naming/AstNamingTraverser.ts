import Parser from "tree-sitter"
import { NamingViolation } from "../../../domain/value-objects/NamingViolation"
import { AST_CLASS_TYPES, AST_FUNCTION_TYPES, AST_VARIABLE_TYPES } from "../../../shared/constants"
import { AstClassNameAnalyzer } from "./AstClassNameAnalyzer"
import { AstFunctionNameAnalyzer } from "./AstFunctionNameAnalyzer"
import { AstInterfaceNameAnalyzer } from "./AstInterfaceNameAnalyzer"
import { AstVariableNameAnalyzer } from "./AstVariableNameAnalyzer"

type NodeAnalyzer = (
    node: Parser.SyntaxNode,
    layer: string,
    filePath: string,
    lines: string[],
) => NamingViolation | null

/**
 * AST tree traverser for detecting naming convention violations
 *
 * Walks through the Abstract Syntax Tree and uses analyzers
 * to detect naming violations in classes, interfaces, functions, and variables.
 */
export class AstNamingTraverser {
    private readonly nodeHandlers: Map<string, NodeAnalyzer>

    constructor(
        private readonly classAnalyzer: AstClassNameAnalyzer,
        private readonly interfaceAnalyzer: AstInterfaceNameAnalyzer,
        private readonly functionAnalyzer: AstFunctionNameAnalyzer,
        private readonly variableAnalyzer: AstVariableNameAnalyzer,
    ) {
        this.nodeHandlers = this.buildNodeHandlers()
    }

    /**
     * Traverses the AST tree and collects naming violations
     */
    public traverse(
        tree: Parser.Tree,
        sourceCode: string,
        layer: string,
        filePath: string,
    ): NamingViolation[] {
        const results: NamingViolation[] = []
        const lines = sourceCode.split("\n")
        const cursor = tree.walk()

        this.visit(cursor, lines, layer, filePath, results)

        return results
    }

    private buildNodeHandlers(): Map<string, NodeAnalyzer> {
        const handlers = new Map<string, NodeAnalyzer>()

        handlers.set(AST_CLASS_TYPES.CLASS_DECLARATION, (node, layer, filePath, lines) =>
            this.classAnalyzer.analyze(node, layer, filePath, lines),
        )
        handlers.set(AST_CLASS_TYPES.INTERFACE_DECLARATION, (node, layer, filePath, lines) =>
            this.interfaceAnalyzer.analyze(node, layer, filePath, lines),
        )

        const functionHandler: NodeAnalyzer = (node, layer, filePath, lines) =>
            this.functionAnalyzer.analyze(node, layer, filePath, lines)
        handlers.set(AST_FUNCTION_TYPES.FUNCTION_DECLARATION, functionHandler)
        handlers.set(AST_FUNCTION_TYPES.METHOD_DEFINITION, functionHandler)
        handlers.set(AST_FUNCTION_TYPES.FUNCTION_SIGNATURE, functionHandler)

        const variableHandler: NodeAnalyzer = (node, layer, filePath, lines) =>
            this.variableAnalyzer.analyze(node, layer, filePath, lines)
        handlers.set(AST_VARIABLE_TYPES.VARIABLE_DECLARATOR, variableHandler)
        handlers.set(AST_VARIABLE_TYPES.REQUIRED_PARAMETER, variableHandler)
        handlers.set(AST_VARIABLE_TYPES.OPTIONAL_PARAMETER, variableHandler)
        handlers.set(AST_VARIABLE_TYPES.PUBLIC_FIELD_DEFINITION, variableHandler)
        handlers.set(AST_VARIABLE_TYPES.PROPERTY_SIGNATURE, variableHandler)

        return handlers
    }

    /**
     * Recursively visits AST nodes
     */
    private visit(
        cursor: Parser.TreeCursor,
        lines: string[],
        layer: string,
        filePath: string,
        results: NamingViolation[],
    ): void {
        const node = cursor.currentNode
        const handler = this.nodeHandlers.get(node.type)

        if (handler) {
            const violation = handler(node, layer, filePath, lines)
            if (violation) {
                results.push(violation)
            }
        }

        if (cursor.gotoFirstChild()) {
            do {
                this.visit(cursor, lines, layer, filePath, results)
            } while (cursor.gotoNextSibling())
            cursor.gotoParent()
        }
    }
}
