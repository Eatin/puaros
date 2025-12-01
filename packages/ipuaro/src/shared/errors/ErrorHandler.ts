/**
 * ErrorHandler service for handling errors with user interaction.
 * Implements the error handling matrix from ROADMAP.md.
 */

import { ERROR_MATRIX, type ErrorOption, type ErrorType, IpuaroError } from "./IpuaroError.js"

/**
 * Result of error handling.
 */
export interface ErrorHandlingResult {
    action: ErrorOption
    shouldContinue: boolean
    retryCount?: number
}

/**
 * Callback for requesting user choice on error.
 */
export type ErrorChoiceCallback = (
    error: IpuaroError,
    availableOptions: ErrorOption[],
    defaultOption: ErrorOption,
) => Promise<ErrorOption>

/**
 * Options for ErrorHandler.
 */
export interface ErrorHandlerOptions {
    maxRetries?: number
    autoSkipParseErrors?: boolean
    autoRetryLLMErrors?: boolean
    onError?: ErrorChoiceCallback
}

const DEFAULT_MAX_RETRIES = 3

/**
 * Error handler service with matrix-based logic.
 */
export class ErrorHandler {
    private readonly maxRetries: number
    private readonly autoSkipParseErrors: boolean
    private readonly autoRetryLLMErrors: boolean
    private readonly onError?: ErrorChoiceCallback

    private readonly retryCounters = new Map<string, number>()

    constructor(options: ErrorHandlerOptions = {}) {
        this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
        this.autoSkipParseErrors = options.autoSkipParseErrors ?? true
        this.autoRetryLLMErrors = options.autoRetryLLMErrors ?? false
        this.onError = options.onError
    }

    /**
     * Handle an error and determine the action to take.
     */
    async handle(error: IpuaroError, contextKey?: string): Promise<ErrorHandlingResult> {
        const key = contextKey ?? error.message
        const currentRetries = this.retryCounters.get(key) ?? 0

        if (this.shouldAutoHandle(error)) {
            const autoAction = this.getAutoAction(error, currentRetries)
            if (autoAction) {
                return this.createResult(autoAction, key, currentRetries)
            }
        }

        if (!error.recoverable) {
            return {
                action: "abort",
                shouldContinue: false,
            }
        }

        if (this.onError) {
            const choice = await this.onError(error, error.options, error.defaultOption)
            return this.createResult(choice, key, currentRetries)
        }

        return this.createResult(error.defaultOption, key, currentRetries)
    }

    /**
     * Handle an error synchronously with default behavior.
     */
    handleSync(error: IpuaroError, contextKey?: string): ErrorHandlingResult {
        const key = contextKey ?? error.message
        const currentRetries = this.retryCounters.get(key) ?? 0

        if (this.shouldAutoHandle(error)) {
            const autoAction = this.getAutoAction(error, currentRetries)
            if (autoAction) {
                return this.createResult(autoAction, key, currentRetries)
            }
        }

        if (!error.recoverable) {
            return {
                action: "abort",
                shouldContinue: false,
            }
        }

        return this.createResult(error.defaultOption, key, currentRetries)
    }

    /**
     * Reset retry counters.
     */
    resetRetries(contextKey?: string): void {
        if (contextKey) {
            this.retryCounters.delete(contextKey)
        } else {
            this.retryCounters.clear()
        }
    }

    /**
     * Get retry count for a context.
     */
    getRetryCount(contextKey: string): number {
        return this.retryCounters.get(contextKey) ?? 0
    }

    /**
     * Check if max retries exceeded for a context.
     */
    isMaxRetriesExceeded(contextKey: string): boolean {
        return this.getRetryCount(contextKey) >= this.maxRetries
    }

    /**
     * Wrap a function with error handling.
     */
    async wrap<T>(
        fn: () => Promise<T>,
        errorType: ErrorType,
        contextKey?: string,
    ): Promise<{ success: true; data: T } | { success: false; result: ErrorHandlingResult }> {
        try {
            const data = await fn()
            if (contextKey) {
                this.resetRetries(contextKey)
            }
            return { success: true, data }
        } catch (err) {
            const error =
                err instanceof IpuaroError
                    ? err
                    : new IpuaroError(errorType, err instanceof Error ? err.message : String(err))

            const result = await this.handle(error, contextKey)
            return { success: false, result }
        }
    }

    /**
     * Wrap a function with retry logic.
     */
    async withRetry<T>(fn: () => Promise<T>, errorType: ErrorType, contextKey: string): Promise<T> {
        const key = contextKey

        while (!this.isMaxRetriesExceeded(key)) {
            try {
                const result = await fn()
                this.resetRetries(key)
                return result
            } catch (err) {
                const error =
                    err instanceof IpuaroError
                        ? err
                        : new IpuaroError(
                              errorType,
                              err instanceof Error ? err.message : String(err),
                          )

                const handlingResult = await this.handle(error, key)

                if (handlingResult.action !== "retry" || !handlingResult.shouldContinue) {
                    throw error
                }
            }
        }

        throw new IpuaroError(
            errorType,
            `Max retries (${String(this.maxRetries)}) exceeded for: ${key}`,
        )
    }

    private shouldAutoHandle(error: IpuaroError): boolean {
        if (error.type === "parse" && this.autoSkipParseErrors) {
            return true
        }
        if ((error.type === "llm" || error.type === "timeout") && this.autoRetryLLMErrors) {
            return true
        }
        return false
    }

    private getAutoAction(error: IpuaroError, currentRetries: number): ErrorOption | null {
        if (error.type === "parse" && this.autoSkipParseErrors) {
            return "skip"
        }

        if ((error.type === "llm" || error.type === "timeout") && this.autoRetryLLMErrors) {
            if (currentRetries < this.maxRetries) {
                return "retry"
            }
            return "abort"
        }

        return null
    }

    private createResult(
        action: ErrorOption,
        key: string,
        currentRetries: number,
    ): ErrorHandlingResult {
        if (action === "retry") {
            this.retryCounters.set(key, currentRetries + 1)
            const newRetryCount = currentRetries + 1

            if (newRetryCount > this.maxRetries) {
                return {
                    action: "abort",
                    shouldContinue: false,
                    retryCount: newRetryCount,
                }
            }

            return {
                action: "retry",
                shouldContinue: true,
                retryCount: newRetryCount,
            }
        }

        this.retryCounters.delete(key)

        return {
            action,
            shouldContinue: action === "skip" || action === "confirm" || action === "regenerate",
            retryCount: currentRetries,
        }
    }
}

/**
 * Get available options for an error type.
 */
export function getErrorOptions(errorType: ErrorType): ErrorOption[] {
    return ERROR_MATRIX[errorType].options
}

/**
 * Get default option for an error type.
 */
export function getDefaultErrorOption(errorType: ErrorType): ErrorOption {
    return ERROR_MATRIX[errorType].defaultOption
}

/**
 * Check if an error type is recoverable by default.
 */
export function isRecoverableError(errorType: ErrorType): boolean {
    return ERROR_MATRIX[errorType].recoverable
}

/**
 * Convert any error to IpuaroError.
 */
export function toIpuaroError(error: unknown, defaultType: ErrorType = "unknown"): IpuaroError {
    if (error instanceof IpuaroError) {
        return error
    }

    if (error instanceof Error) {
        return new IpuaroError(defaultType, error.message, {
            context: { originalError: error.name },
        })
    }

    return new IpuaroError(defaultType, String(error))
}

/**
 * Create a default ErrorHandler instance.
 */
export function createErrorHandler(options?: ErrorHandlerOptions): ErrorHandler {
    return new ErrorHandler(options)
}
