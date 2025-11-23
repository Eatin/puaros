/**
 * Base error class for custom application errors
 */
export abstract class BaseError extends Error {
    public readonly timestamp: Date;
    public readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.timestamp = new Date();
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends BaseError {
    constructor(message: string) {
        super(message, 'VALIDATION_ERROR');
    }
}

export class NotFoundError extends BaseError {
    constructor(message: string) {
        super(message, 'NOT_FOUND');
    }
}

export class UnauthorizedError extends BaseError {
    constructor(message: string) {
        super(message, 'UNAUTHORIZED');
    }
}

export class InternalError extends BaseError {
    constructor(message: string) {
        super(message, 'INTERNAL_ERROR');
    }
}
