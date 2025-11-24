export const DTO_SUFFIXES = [
    "Dto",
    "DTO",
    "Request",
    "Response",
    "Command",
    "Query",
    "Result",
] as const

export const PRIMITIVE_TYPES = [
    "string",
    "number",
    "boolean",
    "void",
    "any",
    "unknown",
    "null",
    "undefined",
    "object",
    "never",
] as const

export const NULLABLE_TYPES = ["null", "undefined"] as const

export const TEST_FILE_EXTENSIONS = [".test.", ".spec."] as const

export const TEST_FILE_SUFFIXES = [".test.ts", ".test.js", ".spec.ts", ".spec.js"] as const
