import { HardcodedValue } from "../value-objects/HardcodedValue"

export interface ValueLocation {
    file: string
    line: number
    context: string
}

export interface DuplicateInfo {
    value: string | number | boolean
    locations: ValueLocation[]
    count: number
}

/**
 * Interface for tracking duplicate hardcoded values across files
 *
 * Helps identify values that are used in multiple places
 * and should be extracted to a shared constant.
 */
export interface IDuplicateValueTracker {
    /**
     * Adds a hardcoded value to tracking
     */
    track(violation: HardcodedValue, filePath: string): void

    /**
     * Gets all duplicate values (values used in 2+ places)
     */
    getDuplicates(): DuplicateInfo[]

    /**
     * Gets duplicate locations for a specific value
     */
    getDuplicateLocations(value: string | number | boolean, type: string): ValueLocation[] | null

    /**
     * Checks if a value is duplicated
     */
    isDuplicate(value: string | number | boolean, type: string): boolean

    /**
     * Gets statistics about duplicates
     */
    getStats(): {
        totalValues: number
        duplicateValues: number
        duplicatePercentage: number
    }

    /**
     * Clears all tracked values
     */
    clear(): void
}
