export const APP_CONSTANTS = {
    DEFAULT_TIMEOUT: 5000,
    MAX_RETRIES: 3,
    VERSION: '0.0.1',
} as const;

export const ERROR_MESSAGES = {
    VALIDATION_FAILED: 'Validation failed',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    INTERNAL_ERROR: 'Internal server error',
} as const;
