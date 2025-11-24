/**
 * Default file scanning options
 */
export const DEFAULT_EXCLUDES = [
    "node_modules",
    "dist",
    "build",
    "coverage",
    ".git",
    ".puaros",
    "tests",
    "test",
    "__tests__",
    "examples",
] as const

export const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"] as const

/**
 * Allowed numbers that are not considered magic numbers
 */
export const ALLOWED_NUMBERS = new Set([-1, 0, 1, 2, 10, 100, 1000])

/**
 * Default context extraction size (characters)
 */
export const CONTEXT_EXTRACT_SIZE = 30

/**
 * String length threshold for magic string detection
 */
export const MIN_STRING_LENGTH = 3

/**
 * Single character limit for string detection
 */
export const SINGLE_CHAR_LIMIT = 1

/**
 * Git defaults
 */
export const GIT_DEFAULTS = {
    REMOTE: "origin",
    BRANCH: "main",
} as const

/**
 * Tree-sitter node types for function detection
 */
export const TREE_SITTER_NODE_TYPES = {
    FUNCTION_DECLARATION: "function_declaration",
    ARROW_FUNCTION: "arrow_function",
    FUNCTION_EXPRESSION: "function_expression",
} as const

/**
 * Detection keywords for hardcode analysis
 */
export const DETECTION_KEYWORDS = {
    TIMEOUT: "timeout",
    DELAY: "delay",
    RETRY: "retry",
    LIMIT: "limit",
    MAX: "max",
    MIN: "min",
    PORT: "port",
    INTERVAL: "interval",
    TEST: "test",
    DESCRIBE: "describe",
    CONSOLE_LOG: "console.log",
    CONSOLE_ERROR: "console.error",
    HTTP: "http",
    API: "api",
} as const

/**
 * Code patterns for detecting exported constants
 */
export const CODE_PATTERNS = {
    EXPORT_CONST: "export const ",
    EXPORT: "export ",
    IMPORT: "import ",
    AS_CONST: " as const",
    AS_CONST_OBJECT: "} as const",
    AS_CONST_ARRAY: "] as const",
    AS_CONST_END_SEMICOLON_OBJECT: "};",
    AS_CONST_END_SEMICOLON_ARRAY: "];",
    OBJECT_START: "= {",
    ARRAY_START: "= [",
} as const

/**
 * File encoding
 */
export const FILE_ENCODING = "utf-8" as const
