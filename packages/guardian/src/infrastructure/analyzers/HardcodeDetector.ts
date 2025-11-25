import { IHardcodeDetector } from "../../domain/services/IHardcodeDetector"
import { HardcodedValue } from "../../domain/value-objects/HardcodedValue"
import { BraceTracker } from "../strategies/BraceTracker"
import { ConstantsFileChecker } from "../strategies/ConstantsFileChecker"
import { ExportConstantAnalyzer } from "../strategies/ExportConstantAnalyzer"
import { MagicNumberMatcher } from "../strategies/MagicNumberMatcher"
import { MagicStringMatcher } from "../strategies/MagicStringMatcher"

/**
 * Detects hardcoded values (magic numbers and strings) in TypeScript/JavaScript code
 *
 * This detector identifies configuration values, URLs, timeouts, ports, and other
 * constants that should be extracted to configuration files. It uses pattern matching
 * and context analysis to reduce false positives.
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
    private readonly braceTracker: BraceTracker
    private readonly exportAnalyzer: ExportConstantAnalyzer
    private readonly numberMatcher: MagicNumberMatcher
    private readonly stringMatcher: MagicStringMatcher

    constructor() {
        this.constantsChecker = new ConstantsFileChecker()
        this.braceTracker = new BraceTracker()
        this.exportAnalyzer = new ExportConstantAnalyzer(this.braceTracker)
        this.numberMatcher = new MagicNumberMatcher(this.exportAnalyzer)
        this.stringMatcher = new MagicStringMatcher(this.exportAnalyzer)
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

        const magicNumbers = this.numberMatcher.detect(code)
        const magicStrings = this.stringMatcher.detect(code)

        return [...magicNumbers, ...magicStrings]
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

        return this.numberMatcher.detect(code)
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

        return this.stringMatcher.detect(code)
    }
}
