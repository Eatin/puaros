/**
 * Interface for parsing source code
 * Allows infrastructure implementations without domain coupling
 */
export interface ICodeParser {
    parseJavaScript(code: string): unknown
    parseTypeScript(code: string): unknown
    parseTsx(code: string): unknown
    extractFunctions(tree: unknown): string[]
}
