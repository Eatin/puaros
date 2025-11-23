/**
 * Type guard utilities for runtime type checking
 */
export class Guards {
    public static isNullOrUndefined(value: unknown): value is null | undefined {
        return value === null || value === undefined;
    }

    public static isString(value: unknown): value is string {
        return typeof value === 'string';
    }

    public static isNumber(value: unknown): value is number {
        return typeof value === 'number' && !isNaN(value);
    }

    public static isBoolean(value: unknown): value is boolean {
        return typeof value === 'boolean';
    }

    public static isObject(value: unknown): value is object {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }

    public static isArray<T>(value: unknown): value is T[] {
        return Array.isArray(value);
    }

    public static isEmpty(value: string | unknown[] | object | null | undefined): boolean {
        if (Guards.isNullOrUndefined(value)) {
            return true;
        }

        if (Guards.isString(value) || Guards.isArray(value)) {
            return value.length === 0;
        }

        if (Guards.isObject(value)) {
            return Object.keys(value).length === 0;
        }

        return false;
    }
}
