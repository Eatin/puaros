import { HardcodedValue } from "../../domain/value-objects/HardcodedValue"
import type {
    DuplicateInfo,
    IDuplicateValueTracker,
    ValueLocation,
} from "../../domain/services/IDuplicateValueTracker"

/**
 * Tracks duplicate hardcoded values across files
 *
 * Helps identify values that are used in multiple places
 * and should be extracted to a shared constant.
 */
export class DuplicateValueTracker implements IDuplicateValueTracker {
    private readonly valueMap = new Map<string, ValueLocation[]>()

    /**
     * Adds a hardcoded value to tracking
     */
    public track(violation: HardcodedValue, filePath: string): void {
        const key = this.createKey(violation.value, violation.type)
        const location: ValueLocation = {
            file: filePath,
            line: violation.line,
            context: violation.context,
        }

        const locations = this.valueMap.get(key)
        if (!locations) {
            this.valueMap.set(key, [location])
        } else {
            locations.push(location)
        }
    }

    /**
     * Gets all duplicate values (values used in 2+ places)
     */
    public getDuplicates(): DuplicateInfo[] {
        const duplicates: DuplicateInfo[] = []

        for (const [key, locations] of this.valueMap.entries()) {
            if (locations.length >= 2) {
                const { value } = this.parseKey(key)
                duplicates.push({
                    value,
                    locations,
                    count: locations.length,
                })
            }
        }

        return duplicates.sort((a, b) => b.count - a.count)
    }

    /**
     * Gets duplicate locations for a specific value
     */
    public getDuplicateLocations(
        value: string | number | boolean,
        type: string,
    ): ValueLocation[] | null {
        const key = this.createKey(value, type)
        const locations = this.valueMap.get(key)

        if (!locations || locations.length < 2) {
            return null
        }

        return locations
    }

    /**
     * Checks if a value is duplicated
     */
    public isDuplicate(value: string | number | boolean, type: string): boolean {
        const key = this.createKey(value, type)
        const locations = this.valueMap.get(key)
        return locations ? locations.length >= 2 : false
    }

    /**
     * Creates a unique key for a value
     */
    private createKey(value: string | number | boolean, type: string): string {
        return `${type}:${String(value)}`
    }

    /**
     * Parses a key back to value and type
     */
    private parseKey(key: string): { value: string; type: string } {
        const [type, ...valueParts] = key.split(":")
        return { value: valueParts.join(":"), type }
    }

    /**
     * Gets statistics about duplicates
     */
    public getStats(): {
        totalValues: number
        duplicateValues: number
        duplicatePercentage: number
    } {
        const totalValues = this.valueMap.size
        const duplicateValues = this.getDuplicates().length
        const duplicatePercentage = totalValues > 0 ? (duplicateValues / totalValues) * 100 : 0

        return {
            totalValues,
            duplicateValues,
            duplicatePercentage,
        }
    }

    /**
     * Clears all tracked values
     */
    public clear(): void {
        this.valueMap.clear()
    }
}
