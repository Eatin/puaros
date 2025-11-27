import Parser from "tree-sitter"
import {
    AST_FIELD_NAMES,
    AST_IDENTIFIER_TYPES,
    AST_MODIFIER_TYPES,
    AST_VARIABLE_TYPES,
} from "../../shared/constants/ast-node-types"

/**
 * AST context checker for analyzing node contexts
 *
 * Provides reusable methods to check if a node is in specific contexts
 * like exports, type declarations, function calls, etc.
 */
export class AstContextChecker {
    /**
     * Checks if node is in an exported constant with "as const"
     */
    public isInExportedConstant(node: Parser.SyntaxNode): boolean {
        let current = node.parent

        while (current) {
            if (current.type === "export_statement") {
                if (this.checkExportedConstant(current)) {
                    return true
                }
            }
            current = current.parent
        }

        return false
    }

    /**
     * Helper to check if export statement contains "as const"
     */
    private checkExportedConstant(exportNode: Parser.SyntaxNode): boolean {
        const declaration = exportNode.childForFieldName(AST_FIELD_NAMES.DECLARATION)
        if (!declaration) {
            return false
        }

        if (declaration.type !== "lexical_declaration") {
            return false
        }

        const declarator = this.findDescendant(declaration, AST_VARIABLE_TYPES.VARIABLE_DECLARATOR)
        if (!declarator) {
            return false
        }

        const value = declarator.childForFieldName(AST_FIELD_NAMES.VALUE)
        if (value?.type !== "as_expression") {
            return false
        }

        const asType = value.children.find((c) => c.type === AST_MODIFIER_TYPES.CONST)
        return asType !== undefined
    }

    /**
     * Checks if node is in a type context (union type, type alias, interface)
     */
    public isInTypeContext(node: Parser.SyntaxNode): boolean {
        let current = node.parent

        while (current) {
            if (
                current.type === "type_alias_declaration" ||
                current.type === "union_type" ||
                current.type === "literal_type" ||
                current.type === "interface_declaration" ||
                current.type === "type_annotation"
            ) {
                return true
            }
            current = current.parent
        }

        return false
    }

    /**
     * Checks if node is in an import statement or import() call
     */
    public isInImportStatement(node: Parser.SyntaxNode): boolean {
        let current = node.parent

        while (current) {
            if (current.type === "import_statement") {
                return true
            }

            if (current.type === "call_expression") {
                const functionNode =
                    current.childForFieldName(AST_FIELD_NAMES.FUNCTION) ||
                    current.children.find(
                        (c) =>
                            c.type === AST_IDENTIFIER_TYPES.IDENTIFIER ||
                            c.type === AST_IDENTIFIER_TYPES.IMPORT,
                    )

                if (
                    functionNode &&
                    (functionNode.text === "import" ||
                        functionNode.type === AST_IDENTIFIER_TYPES.IMPORT)
                ) {
                    return true
                }
            }

            current = current.parent
        }

        return false
    }

    /**
     * Checks if node is in a test description (test(), describe(), it())
     */
    public isInTestDescription(node: Parser.SyntaxNode): boolean {
        let current = node.parent

        while (current) {
            if (current.type === "call_expression") {
                const callee = current.childForFieldName("function")
                if (callee?.type === "identifier") {
                    const funcName = callee.text
                    if (
                        funcName === "test" ||
                        funcName === "describe" ||
                        funcName === "it" ||
                        funcName === "expect"
                    ) {
                        return true
                    }
                }
            }
            current = current.parent
        }

        return false
    }

    /**
     * Checks if node is in a console.log or console.error call
     */
    public isInConsoleCall(node: Parser.SyntaxNode): boolean {
        let current = node.parent

        while (current) {
            if (current.type === "call_expression") {
                const callee = current.childForFieldName("function")
                if (callee?.type === "member_expression") {
                    const object = callee.childForFieldName("object")
                    const property = callee.childForFieldName("property")

                    if (
                        object?.text === "console" &&
                        property &&
                        (property.text === "log" ||
                            property.text === "error" ||
                            property.text === "warn")
                    ) {
                        return true
                    }
                }
            }
            current = current.parent
        }

        return false
    }

    /**
     * Checks if node is in a Symbol() call
     */
    public isInSymbolCall(node: Parser.SyntaxNode): boolean {
        let current = node.parent

        while (current) {
            if (current.type === "call_expression") {
                const callee = current.childForFieldName("function")
                if (callee?.type === "identifier" && callee.text === "Symbol") {
                    return true
                }
            }
            current = current.parent
        }

        return false
    }

    /**
     * Checks if node is in a typeof check
     */
    public isInTypeofCheck(node: Parser.SyntaxNode): boolean {
        let current = node.parent

        while (current) {
            if (current.type === "binary_expression") {
                const left = current.childForFieldName("left")
                const right = current.childForFieldName("right")

                if (left?.type === "unary_expression") {
                    const operator = left.childForFieldName("operator")
                    if (operator?.text === "typeof") {
                        return true
                    }
                }

                if (right?.type === "unary_expression") {
                    const operator = right.childForFieldName("operator")
                    if (operator?.text === "typeof") {
                        return true
                    }
                }
            }
            current = current.parent
        }

        return false
    }

    /**
     * Checks if parent is a call expression with specific function names
     */
    public isInCallExpression(parent: Parser.SyntaxNode, functionNames: string[]): boolean {
        if (parent.type === "arguments") {
            const callExpr = parent.parent
            if (callExpr?.type === "call_expression") {
                const callee = callExpr.childForFieldName("function")
                if (callee?.type === "identifier") {
                    return functionNames.includes(callee.text)
                }
            }
        }
        return false
    }

    /**
     * Gets context text around a node
     */
    public getNodeContext(node: Parser.SyntaxNode): string {
        let current: Parser.SyntaxNode | null = node

        while (
            current &&
            current.type !== "lexical_declaration" &&
            current.type !== "pair" &&
            current.type !== "call_expression" &&
            current.type !== "return_statement"
        ) {
            current = current.parent
        }

        return current ? current.text.toLowerCase() : ""
    }

    /**
     * Finds a descendant node by type
     */
    private findDescendant(node: Parser.SyntaxNode, type: string): Parser.SyntaxNode | null {
        if (node.type === type) {
            return node
        }

        for (const child of node.children) {
            const result = this.findDescendant(child, type)
            if (result) {
                return result
            }
        }

        return null
    }
}
