import { CODE_PATTERNS } from "../constants/defaults"
import { BraceTracker } from "./BraceTracker"

/**
 * Analyzes export const declarations in code
 *
 * Determines if a line is inside an exported constant declaration
 * to skip hardcode detection in constant definitions.
 */
export class ExportConstantAnalyzer {
    constructor(private readonly braceTracker: BraceTracker) {}

    /**
     * Checks if a line is inside an exported constant definition
     */
    public isInExportedConstant(lines: string[], lineIndex: number): boolean {
        const currentLineTrimmed = lines[lineIndex].trim()

        if (this.isSingleLineExportConst(currentLineTrimmed)) {
            return true
        }

        const exportConstStart = this.findExportConstStart(lines, lineIndex)
        if (exportConstStart === -1) {
            return false
        }

        const { braces, brackets } = this.braceTracker.countUnclosed(
            lines,
            exportConstStart,
            lineIndex,
        )

        return braces > 0 || brackets > 0
    }

    /**
     * Checks if a line is a single-line export const declaration
     */
    public isSingleLineExportConst(line: string): boolean {
        if (!line.startsWith(CODE_PATTERNS.EXPORT_CONST)) {
            return false
        }

        const hasObjectOrArray = this.hasObjectOrArray(line)

        if (hasObjectOrArray) {
            return this.hasAsConstEnding(line)
        }

        return line.includes(CODE_PATTERNS.AS_CONST)
    }

    /**
     * Finds the starting line of an export const declaration
     */
    public findExportConstStart(lines: string[], lineIndex: number): number {
        for (let currentLine = lineIndex; currentLine >= 0; currentLine--) {
            const trimmed = lines[currentLine].trim()

            if (this.isExportConstWithStructure(trimmed)) {
                return currentLine
            }

            if (this.isTopLevelStatement(trimmed, currentLine, lineIndex)) {
                break
            }
        }

        return -1
    }

    /**
     * Checks if line has object or array structure
     */
    private hasObjectOrArray(line: string): boolean {
        return line.includes(CODE_PATTERNS.OBJECT_START) || line.includes(CODE_PATTERNS.ARRAY_START)
    }

    /**
     * Checks if line has 'as const' ending
     */
    private hasAsConstEnding(line: string): boolean {
        return (
            line.includes(CODE_PATTERNS.AS_CONST_OBJECT) ||
            line.includes(CODE_PATTERNS.AS_CONST_ARRAY) ||
            line.includes(CODE_PATTERNS.AS_CONST_END_SEMICOLON_OBJECT) ||
            line.includes(CODE_PATTERNS.AS_CONST_END_SEMICOLON_ARRAY)
        )
    }

    /**
     * Checks if line is export const with object or array
     */
    private isExportConstWithStructure(trimmed: string): boolean {
        return (
            trimmed.startsWith(CODE_PATTERNS.EXPORT_CONST) &&
            (trimmed.includes(CODE_PATTERNS.OBJECT_START) ||
                trimmed.includes(CODE_PATTERNS.ARRAY_START))
        )
    }

    /**
     * Checks if line is a top-level statement
     */
    private isTopLevelStatement(trimmed: string, currentLine: number, lineIndex: number): boolean {
        return (
            currentLine < lineIndex &&
            (trimmed.startsWith(CODE_PATTERNS.EXPORT) || trimmed.startsWith(CODE_PATTERNS.IMPORT))
        )
    }
}
