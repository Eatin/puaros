import { ERROR_CODES } from "../constants"

/**
 * Error codes (re-exported for backwards compatibility)
 */
const LEGACY_ERROR_CODES = ERROR_CODES

/**
 * Base error class for custom application errors
 */
export abstract class BaseError extends Error {
    public readonly timestamp: Date
    public readonly code: string

    constructor(message: string, code: string) {
        super(message)
        this.name = this.constructor.name
        this.code = code
        this.timestamp = new Date()
        Error.captureStackTrace(this, this.constructor)
    }
}

export class ValidationError extends BaseError {
    constructor(message: string) {
        super(message, LEGACY_ERROR_CODES.VALIDATION_ERROR)
    }
}

export class NotFoundError extends BaseError {
    constructor(message: string) {
        super(message, LEGACY_ERROR_CODES.NOT_FOUND)
    }
}

export class UnauthorizedError extends BaseError {
    constructor(message: string) {
        super(message, LEGACY_ERROR_CODES.UNAUTHORIZED)
    }
}

export class InternalError extends BaseError {
    constructor(message: string) {
        super(message, LEGACY_ERROR_CODES.INTERNAL_ERROR)
    }
}
