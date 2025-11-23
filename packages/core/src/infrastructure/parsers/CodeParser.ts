import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';

/**
 * Code parser service using tree-sitter
 */
export class CodeParser {
    private readonly parser: Parser;

    constructor() {
        this.parser = new Parser();
    }

    public parseJavaScript(code: string): Parser.Tree {
        this.parser.setLanguage(JavaScript);
        return this.parser.parse(code);
    }

    public parseTypeScript(code: string): Parser.Tree {
        this.parser.setLanguage(TypeScript.typescript);
        return this.parser.parse(code);
    }

    public parseTsx(code: string): Parser.Tree {
        this.parser.setLanguage(TypeScript.tsx);
        return this.parser.parse(code);
    }

    public extractFunctions(tree: Parser.Tree): string[] {
        const functions: string[] = [];
        const cursor = tree.walk();

        const visit = (): void => {
            const node = cursor.currentNode;

            if (
                node.type === 'function_declaration' ||
                node.type === 'arrow_function' ||
                node.type === 'function_expression'
            ) {
                functions.push(node.text);
            }

            if (cursor.gotoFirstChild()) {
                do {
                    visit();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        };

        visit();
        return functions;
    }
}