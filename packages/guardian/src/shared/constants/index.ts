export const APP_CONSTANTS = {
    DEFAULT_TIMEOUT: 5000,
    MAX_RETRIES: 3,
    VERSION: "0.0.1",
} as const

export const ERROR_MESSAGES = {
    VALIDATION_FAILED: "Validation failed",
    NOT_FOUND: "Resource not found",
    UNAUTHORIZED: "Unauthorized access",
    INTERNAL_ERROR: "Internal server error",
    FAILED_TO_ANALYZE: "Failed to analyze project",
    FAILED_TO_SCAN_DIR: "Failed to scan directory",
    FAILED_TO_READ_FILE: "Failed to read file",
    ENTITY_NOT_FOUND: "Entity with id {id} not found",
} as const

/**
 * Error codes
 */
export const ERROR_CODES = {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    UNAUTHORIZED: "UNAUTHORIZED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

/**
 * File extension constants
 */
export const FILE_EXTENSIONS = {
    TYPESCRIPT: ".ts",
    TYPESCRIPT_JSX: ".tsx",
    JAVASCRIPT: ".js",
    JAVASCRIPT_JSX: ".jsx",
} as const

/**
 * TypeScript primitive type names
 */
export const TYPE_NAMES = {
    STRING: "string",
    NUMBER: "number",
    BOOLEAN: "boolean",
    OBJECT: "object",
} as const

/**
 * Common regex patterns
 */
export const REGEX_PATTERNS = {
    IMPORT_STATEMENT: /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
    EXPORT_STATEMENT: /export\s+(?:class|function|const|let|var)\s+(\w+)/g,
} as const

/**
 * Placeholders for string templates
 */
export const PLACEHOLDERS = {
    ID: "{id}",
} as const

/**
 * Violation severity levels
 */
export const SEVERITY_LEVELS = {
    ERROR: "error",
    WARNING: "warning",
    INFO: "info",
} as const

export * from "./rules"
