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
 * Context keywords for email detection
 */
export const EMAIL_CONTEXT_KEYWORDS = {
    ADMIN: "admin",
    SUPPORT: "support",
    NOREPLY: "noreply",
    NO_REPLY: "no-reply",
} as const

/**
 * Context keywords for API key detection
 */
export const API_KEY_CONTEXT_KEYWORDS = {
    SECRET: "secret",
    PUBLIC: "public",
} as const

/**
 * Context keywords for URL detection
 */
export const URL_CONTEXT_KEYWORDS = {
    API: "api",
    DATABASE: "database",
    DB: "db",
    MONGO: "mongo",
    POSTGRES: "postgres",
    PG: "pg",
} as const

/**
 * Context keywords for IP address detection
 */
export const IP_CONTEXT_KEYWORDS = {
    SERVER: "server",
    REDIS: "redis",
} as const

/**
 * Context keywords for file path detection
 */
export const FILE_PATH_CONTEXT_KEYWORDS = {
    LOG: "log",
    DATA: "data",
    TEMP: "temp",
} as const

/**
 * Context keywords for date detection
 */
export const DATE_CONTEXT_KEYWORDS = {
    DEADLINE: "deadline",
    START: "start",
    END: "end",
    EXPIR: "expir",
} as const

/**
 * Context keywords for UUID detection
 */
export const UUID_CONTEXT_KEYWORDS = {
    ID: "id",
    IDENTIFIER: "identifier",
    REQUEST: "request",
    SESSION: "session",
} as const

/**
 * Context keywords for version detection
 */
export const VERSION_CONTEXT_KEYWORDS = {
    APP: "app",
} as const

/**
 * Context keywords for color detection
 */
export const COLOR_CONTEXT_KEYWORDS = {
    PRIMARY: "primary",
    SECONDARY: "secondary",
    BACKGROUND: "background",
} as const

/**
 * Context keywords for base64 detection
 */
export const BASE64_CONTEXT_KEYWORDS = {
    TOKEN: "token",
    KEY: "key",
} as const

/**
 * Context keywords for config detection
 */
export const CONFIG_CONTEXT_KEYWORDS = {
    ENDPOINT: "endpoint",
    ROUTE: "route",
    CONNECTION: "connection",
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
    ADMIN_EMAIL: "ADMIN_EMAIL",
    SUPPORT_EMAIL: "SUPPORT_EMAIL",
    NOREPLY_EMAIL: "NOREPLY_EMAIL",
    DEFAULT_EMAIL: "DEFAULT_EMAIL",
    API_SECRET_KEY: "API_SECRET_KEY",
    API_PUBLIC_KEY: "API_PUBLIC_KEY",
    API_KEY: "API_KEY",
    DATABASE_URL: "DATABASE_URL",
    MONGODB_CONNECTION_STRING: "MONGODB_CONNECTION_STRING",
    POSTGRES_URL: "POSTGRES_URL",
    BASE_URL: "BASE_URL",
    SERVER_IP: "SERVER_IP",
    DATABASE_HOST: "DATABASE_HOST",
    REDIS_HOST: "REDIS_HOST",
    HOST_IP: "HOST_IP",
    LOG_FILE_PATH: "LOG_FILE_PATH",
    CONFIG_FILE_PATH: "CONFIG_FILE_PATH",
    DATA_DIR_PATH: "DATA_DIR_PATH",
    TEMP_DIR_PATH: "TEMP_DIR_PATH",
    FILE_PATH: "FILE_PATH",
    DEADLINE: "DEADLINE",
    START_DATE: "START_DATE",
    END_DATE: "END_DATE",
    EXPIRATION_DATE: "EXPIRATION_DATE",
    DEFAULT_DATE: "DEFAULT_DATE",
    DEFAULT_ID: "DEFAULT_ID",
    REQUEST_ID: "REQUEST_ID",
    SESSION_ID: "SESSION_ID",
    UUID_CONSTANT: "UUID_CONSTANT",
    API_VERSION: "API_VERSION",
    APP_VERSION: "APP_VERSION",
    VERSION: "VERSION",
    PRIMARY_COLOR: "PRIMARY_COLOR",
    SECONDARY_COLOR: "SECONDARY_COLOR",
    BACKGROUND_COLOR: "BACKGROUND_COLOR",
    COLOR_CONSTANT: "COLOR_CONSTANT",
    MAC_ADDRESS: "MAC_ADDRESS",
    ENCODED_TOKEN: "ENCODED_TOKEN",
    ENCODED_KEY: "ENCODED_KEY",
    BASE64_VALUE: "BASE64_VALUE",
    API_ENDPOINT: "API_ENDPOINT",
    ROUTE_PATH: "ROUTE_PATH",
    CONNECTION_STRING: "CONNECTION_STRING",
    CONFIG_VALUE: "CONFIG_VALUE",
} as const

/**
 * Location suggestions
 */
export const LOCATIONS = {
    SHARED_CONSTANTS: "shared/constants",
    DOMAIN_CONSTANTS: "domain/constants",
    INFRASTRUCTURE_CONFIG: "infrastructure/config",
    CONFIG_ENVIRONMENT: "src/config/environment.ts",
    CONFIG_CONTACTS: "src/config/contacts.ts",
    CONFIG_PATHS: "src/config/paths.ts",
    CONFIG_DATES: "src/config/dates.ts",
} as const
