import Parser from "tree-sitter"
import { IHardcodeDetector } from "../../domain/services/IHardcodeDetector"
import { HardcodedValue } from "../../domain/value-objects/HardcodedValue"
import { CodeParser } from "../parsers/CodeParser"
import { AstBooleanAnalyzer } from "../strategies/AstBooleanAnalyzer"
import { AstConfigObjectAnalyzer } from "../strategies/AstConfigObjectAnalyzer"
import { AstContextChecker } from "../strategies/AstContextChecker"
import { AstNumberAnalyzer } from "../strategies/AstNumberAnalyzer"
import { AstStringAnalyzer } from "../strategies/AstStringAnalyzer"
import { ConstantsFileChecker } from "../strategies/ConstantsFileChecker"
import { AstTreeTraverser } from "./AstTreeTraverser"

/**
 * Detects hardcoded values (magic numbers and strings) in TypeScript/JavaScript code
 *
 * This detector uses Abstract Syntax Tree (AST) analysis via tree-sitter to identify
 * configuration values, URLs, timeouts, ports, and other constants that should be
 * extracted to configuration files. AST-based detection provides more accurate context
 * understanding and reduces false positives compared to regex-based approaches.
 *
 * The detector uses a modular architecture with specialized components:
 * - AstContextChecker: Checks if nodes are in specific contexts (exports, types, etc.)
 * - AstNumberAnalyzer: Analyzes number literals to detect magic numbers
 * - AstStringAnalyzer: Analyzes string literals to detect magic strings
 * - AstTreeTraverser: Traverses the AST and coordinates analyzers
 *
 * @example
 * ```typescript
 * const detector = new HardcodeDetector()
 * const code = `
 *     const timeout = 5000
 *     const url = "http://localhost:8080"
 * `
 * const violations = detector.detectAll(code, 'config.ts')
 * // Returns array of HardcodedValue objects
 * ```
 */
export class HardcodeDetector implements IHardcodeDetector {
    private readonly constantsChecker: ConstantsFileChecker
    private readonly parser: CodeParser
    private readonly traverser: AstTreeTraverser

    constructor() {
        this.constantsChecker = new ConstantsFileChecker()
        this.parser = new CodeParser()

        const contextChecker = new AstContextChecker()
        const numberAnalyzer = new AstNumberAnalyzer(contextChecker)
        const stringAnalyzer = new AstStringAnalyzer(contextChecker)
        const booleanAnalyzer = new AstBooleanAnalyzer(contextChecker)
        const configObjectAnalyzer = new AstConfigObjectAnalyzer(contextChecker)

        this.traverser = new AstTreeTraverser(
            numberAnalyzer,
            stringAnalyzer,
            booleanAnalyzer,
            configObjectAnalyzer,
        )
    }

    /**
     * Detects all hardcoded values (both numbers and strings) in the given code
     *
     * @param code - Source code to analyze
     * @param filePath - File path for context (used in violation reports)
     * @returns Array of detected hardcoded values with suggestions
     */
    public detectAll(code: string, filePath: string): HardcodedValue[] {
        if (this.constantsChecker.isConstantsFile(filePath)) {
            return []
        }

        const tree = this.parseCode(code, filePath)
        return this.traverser.traverse(tree, code)
    }

    /**
     * Detects magic numbers in code
     *
     * @param code - Source code to analyze
     * @param filePath - File path (used for constants file check)
     * @returns Array of detected magic numbers
     */
    public detectMagicNumbers(code: string, filePath: string): HardcodedValue[] {
        if (this.constantsChecker.isConstantsFile(filePath)) {
            return []
        }

        const tree = this.parseCode(code, filePath)
        const allViolations = this.traverser.traverse(tree, code)
        return allViolations.filter((v) => v.isMagicNumber())
    }

    /**
     * Detects magic strings in code
     *
     * @param code - Source code to analyze
     * @param filePath - File path (used for constants file check)
     * @returns Array of detected magic strings
     */
    public detectMagicStrings(code: string, filePath: string): HardcodedValue[] {
        if (this.constantsChecker.isConstantsFile(filePath)) {
            return []
        }

        const tree = this.parseCode(code, filePath)
        const allViolations = this.traverser.traverse(tree, code)
        return allViolations.filter((v) => v.isMagicString())
    }

    /**
     * Parses code based on file extension
     */
    private parseCode(code: string, filePath: string): Parser.Tree {
        if (filePath.endsWith(".tsx")) {
            return this.parser.parseTsx(code)
        } else if (filePath.endsWith(".ts")) {
            return this.parser.parseTypeScript(code)
        }
        return this.parser.parseJavaScript(code)
    }
}
