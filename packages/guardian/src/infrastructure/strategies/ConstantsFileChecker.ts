/**
 * Checks if a file is a constants definition file
 *
 * Identifies files that should be skipped for hardcode detection
 * since they are meant to contain constant definitions.
 */
export class ConstantsFileChecker {
    private readonly constantsPatterns = [
        /^constants?\.(ts|js)$/i,
        /constants?\/.*\.(ts|js)$/i,
        /\/(constants|config|settings|defaults|tokens)\.ts$/i,
        /\/di\/tokens\.(ts|js)$/i,
    ]

    /**
     * Checks if a file path represents a constants file
     */
    public isConstantsFile(filePath: string): boolean {
        return this.constantsPatterns.some((pattern) => pattern.test(filePath))
    }
}
