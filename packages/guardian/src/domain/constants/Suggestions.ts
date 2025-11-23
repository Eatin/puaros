/**
 * Suggestion keywords for hardcode detection
 */
export const SUGGESTION_KEYWORDS = {
    TIMEOUT: "timeout",
    RETRY: "retry",
    ATTEMPT: "attempt",
    LIMIT: "limit",
    MAX: "max",
    PORT: "port",
    DELAY: "delay",
    ERROR: "error",
    MESSAGE: "message",
    DEFAULT: "default",
    ENTITY: "entity",
    AGGREGATE: "aggregate",
    DOMAIN: "domain",
    CONFIG: "config",
    ENV: "env",
    HTTP: "http",
    TEST: "test",
    DESCRIBE: "describe",
    CONSOLE_LOG: "console.log",
    CONSOLE_ERROR: "console.error",
} as const

/**
 * Constant name templates
 */
export const CONSTANT_NAMES = {
    TIMEOUT_MS: "TIMEOUT_MS",
    MAX_RETRIES: "MAX_RETRIES",
    MAX_LIMIT: "MAX_LIMIT",
    DEFAULT_PORT: "DEFAULT_PORT",
    DELAY_MS: "DELAY_MS",
    API_BASE_URL: "API_BASE_URL",
    DEFAULT_PATH: "DEFAULT_PATH",
    DEFAULT_DOMAIN: "DEFAULT_DOMAIN",
    ERROR_MESSAGE: "ERROR_MESSAGE",
    DEFAULT_VALUE: "DEFAULT_VALUE",
    MAGIC_STRING: "MAGIC_STRING",
    MAGIC_NUMBER: "MAGIC_NUMBER",
    UNKNOWN_CONSTANT: "UNKNOWN_CONSTANT",
} as const

/**
 * Location suggestions
 */
export const LOCATIONS = {
    SHARED_CONSTANTS: "shared/constants",
    DOMAIN_CONSTANTS: "domain/constants",
    INFRASTRUCTURE_CONFIG: "infrastructure/config",
} as const
