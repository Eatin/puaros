/**
 * Tracks braces and brackets in code for context analysis
 *
 * Used to determine if a line is inside an exported constant
 * by counting unclosed braces and brackets.
 */
export class BraceTracker {
    /**
     * Counts unclosed braces and brackets between two line indices
     */
    public countUnclosed(
        lines: string[],
        startLine: number,
        endLine: number,
    ): { braces: number; brackets: number } {
        let braces = 0
        let brackets = 0

        for (let i = startLine; i <= endLine; i++) {
            const counts = this.countInLine(lines[i])
            braces += counts.braces
            brackets += counts.brackets
        }

        return { braces, brackets }
    }

    /**
     * Counts braces and brackets in a single line
     */
    private countInLine(line: string): { braces: number; brackets: number } {
        let braces = 0
        let brackets = 0
        let inString = false
        let stringChar = ""

        for (let j = 0; j < line.length; j++) {
            const char = line[j]
            const prevChar = j > 0 ? line[j - 1] : ""

            this.updateStringState(
                char,
                prevChar,
                inString,
                stringChar,
                (newInString, newStringChar) => {
                    inString = newInString
                    stringChar = newStringChar
                },
            )

            if (!inString) {
                const counts = this.countChar(char)
                braces += counts.braces
                brackets += counts.brackets
            }
        }

        return { braces, brackets }
    }

    /**
     * Updates string tracking state
     */
    private updateStringState(
        char: string,
        prevChar: string,
        inString: boolean,
        stringChar: string,
        callback: (inString: boolean, stringChar: string) => void,
    ): void {
        if ((char === "'" || char === '"' || char === "`") && prevChar !== "\\") {
            if (!inString) {
                callback(true, char)
            } else if (char === stringChar) {
                callback(false, "")
            }
        }
    }

    /**
     * Counts a single character
     */
    private countChar(char: string): { braces: number; brackets: number } {
        if (char === "{") {
            return { braces: 1, brackets: 0 }
        } else if (char === "}") {
            return { braces: -1, brackets: 0 }
        } else if (char === "[") {
            return { braces: 0, brackets: 1 }
        } else if (char === "]") {
            return { braces: 0, brackets: -1 }
        }
        return { braces: 0, brackets: 0 }
    }
}
