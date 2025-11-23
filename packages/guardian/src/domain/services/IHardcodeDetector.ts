import { HardcodedValue } from "../value-objects/HardcodedValue"

/**
 * Interface for detecting hardcoded values in source code
 */
export interface IHardcodeDetector {
    detectMagicNumbers(code: string, filePath: string): HardcodedValue[]
    detectMagicStrings(code: string, filePath: string): HardcodedValue[]
    detectAll(code: string, filePath: string): HardcodedValue[]
}
