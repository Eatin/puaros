import Parser from "tree-sitter"
import JavaScript from "tree-sitter-javascript"
import TypeScript from "tree-sitter-typescript"
import { ICodeParser } from "../../domain/services/ICodeParser"
import { TREE_SITTER_NODE_TYPES } from "../constants/defaults"

/**
 * Code parser service using tree-sitter
 */
export class CodeParser implements ICodeParser {
    private readonly parser: Parser

    constructor() {
        this.parser = new Parser()
    }

    public parseJavaScript(code: string): Parser.Tree {
        this.parser.setLanguage(JavaScript)
        return this.parser.parse(code)
    }

    public parseTypeScript(code: string): Parser.Tree {
        this.parser.setLanguage(TypeScript.typescript)
        return this.parser.parse(code)
    }

    public parseTsx(code: string): Parser.Tree {
        this.parser.setLanguage(TypeScript.tsx)
        return this.parser.parse(code)
    }

    public extractFunctions(tree: Parser.Tree): string[] {
        const functions: string[] = []
        const cursor = tree.walk()

        const visit = (): void => {
            const node = cursor.currentNode

            if (
                node.type === TREE_SITTER_NODE_TYPES.FUNCTION_DECLARATION ||
                node.type === TREE_SITTER_NODE_TYPES.ARROW_FUNCTION ||
                node.type === TREE_SITTER_NODE_TYPES.FUNCTION_EXPRESSION
            ) {
                functions.push(node.text)
            }

            if (cursor.gotoFirstChild()) {
                do {
                    visit()
                } while (cursor.gotoNextSibling())
                cursor.gotoParent()
            }
        }

        visit()
        return functions
    }
}
