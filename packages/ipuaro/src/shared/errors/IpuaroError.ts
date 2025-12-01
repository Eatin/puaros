/**
 * Error types for ipuaro.
 */
export type ErrorType =
    | "redis"
    | "parse"
    | "llm"
    | "file"
    | "command"
    | "conflict"
    | "validation"
    | "timeout"
    | "unknown"

/**
 * Available options for error recovery.
 */
export type ErrorOption = "retry" | "skip" | "abort" | "confirm" | "regenerate"

/**
 * Error metadata with available options.
 */
export interface ErrorMeta {
    type: ErrorType
    recoverable: boolean
    options: ErrorOption[]
    defaultOption: ErrorOption
}

/**
 * Error handling matrix - defines behavior for each error type.
 */
export const ERROR_MATRIX: Record<ErrorType, Omit<ErrorMeta, "type">> = {
    redis: {
        recoverable: false,
        options: ["retry", "abort"],
        defaultOption: "abort",
    },
    parse: {
        recoverable: true,
        options: ["skip", "abort"],
        defaultOption: "skip",
    },
    llm: {
        recoverable: true,
        options: ["retry", "skip", "abort"],
        defaultOption: "retry",
    },
    file: {
        recoverable: true,
        options: ["skip", "abort"],
        defaultOption: "skip",
    },
    command: {
        recoverable: true,
        options: ["confirm", "skip", "abort"],
        defaultOption: "confirm",
    },
    conflict: {
        recoverable: true,
        options: ["skip", "regenerate", "abort"],
        defaultOption: "skip",
    },
    validation: {
        recoverable: true,
        options: ["skip", "abort"],
        defaultOption: "skip",
    },
    timeout: {
        recoverable: true,
        options: ["retry", "skip", "abort"],
        defaultOption: "retry",
    },
    unknown: {
        recoverable: false,
        options: ["abort"],
        defaultOption: "abort",
    },
}

/**
 * Base error class for ipuaro.
 */
export class IpuaroError extends Error {
    readonly type: ErrorType
    readonly recoverable: boolean
    readonly suggestion?: string
    readonly options: ErrorOption[]
    readonly defaultOption: ErrorOption
    readonly context?: Record<string, unknown>

    constructor(
        type: ErrorType,
        message: string,
        options?: {
            recoverable?: boolean
            suggestion?: string
            context?: Record<string, unknown>
        },
    ) {
        super(message)
        this.name = "IpuaroError"
        this.type = type

        const meta = ERROR_MATRIX[type]
        this.recoverable = options?.recoverable ?? meta.recoverable
        this.options = meta.options
        this.defaultOption = meta.defaultOption
        this.suggestion = options?.suggestion
        this.context = options?.context
    }

    /**
     * Get error metadata.
     */
    getMeta(): ErrorMeta {
        return {
            type: this.type,
            recoverable: this.recoverable,
            options: this.options,
            defaultOption: this.defaultOption,
        }
    }

    /**
     * Check if an option is available for this error.
     */
    hasOption(option: ErrorOption): boolean {
        return this.options.includes(option)
    }

    /**
     * Create a formatted error message with suggestion.
     */
    toDisplayString(): string {
        let result = `[${this.type}] ${this.message}`
        if (this.suggestion) {
            result += `\n  Suggestion: ${this.suggestion}`
        }
        return result
    }

    static redis(message: string, context?: Record<string, unknown>): IpuaroError {
        return new IpuaroError("redis", message, {
            suggestion: "Please ensure Redis is running: redis-server",
            context,
        })
    }

    static parse(message: string, filePath?: string): IpuaroError {
        const msg = filePath ? `${message} in ${filePath}` : message
        return new IpuaroError("parse", msg, {
            suggestion: "File will be skipped during indexing",
            context: filePath ? { filePath } : undefined,
        })
    }

    static llm(message: string, context?: Record<string, unknown>): IpuaroError {
        return new IpuaroError("llm", message, {
            suggestion: "Please ensure Ollama is running and model is available",
            context,
        })
    }

    static llmTimeout(message: string): IpuaroError {
        return new IpuaroError("timeout", message, {
            suggestion: "The LLM request timed out. Try again or check Ollama status.",
        })
    }

    static file(message: string, filePath?: string): IpuaroError {
        return new IpuaroError("file", message, {
            suggestion: "Check if the file exists and you have permission to access it",
            context: filePath ? { filePath } : undefined,
        })
    }

    static fileNotFound(filePath: string): IpuaroError {
        return new IpuaroError("file", `File not found: ${filePath}`, {
            suggestion: "Check the file path and try again",
            context: { filePath },
        })
    }

    static command(message: string, command?: string): IpuaroError {
        return new IpuaroError("command", message, {
            suggestion: "Command requires confirmation or is not in whitelist",
            context: command ? { command } : undefined,
        })
    }

    static commandBlacklisted(command: string): IpuaroError {
        return new IpuaroError("command", `Command is blacklisted: ${command}`, {
            recoverable: false,
            suggestion: "This command is not allowed for security reasons",
            context: { command },
        })
    }

    static conflict(message: string, filePath?: string): IpuaroError {
        return new IpuaroError("conflict", message, {
            suggestion: "File was modified externally. Regenerate or skip the change.",
            context: filePath ? { filePath } : undefined,
        })
    }

    static validation(message: string, field?: string): IpuaroError {
        return new IpuaroError("validation", message, {
            suggestion: "Please check the input and try again",
            context: field ? { field } : undefined,
        })
    }

    static timeout(message: string, timeoutMs?: number): IpuaroError {
        return new IpuaroError("timeout", message, {
            suggestion: "Try again or increase the timeout value",
            context: timeoutMs ? { timeoutMs } : undefined,
        })
    }

    static unknown(message: string, originalError?: Error): IpuaroError {
        return new IpuaroError("unknown", message, {
            context: originalError ? { originalError: originalError.message } : undefined,
        })
    }
}
