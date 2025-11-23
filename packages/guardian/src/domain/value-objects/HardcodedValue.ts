import { ValueObject } from "./ValueObject"
import { HARDCODE_TYPES } from "../../shared/constants/rules"
import { CONSTANT_NAMES, LOCATIONS, SUGGESTION_KEYWORDS } from "../constants/Suggestions"

export type HardcodeType = (typeof HARDCODE_TYPES)[keyof typeof HARDCODE_TYPES]

interface HardcodedValueProps {
    readonly value: string | number
    readonly type: HardcodeType
    readonly line: number
    readonly column: number
    readonly context: string
}

/**
 * Represents a hardcoded value found in source code
 */
export class HardcodedValue extends ValueObject<HardcodedValueProps> {
    private constructor(props: HardcodedValueProps) {
        super(props)
    }

    public static create(
        value: string | number,
        type: HardcodeType,
        line: number,
        column: number,
        context: string,
    ): HardcodedValue {
        return new HardcodedValue({
            value,
            type,
            line,
            column,
            context,
        })
    }

    public get value(): string | number {
        return this.props.value
    }

    public get type(): HardcodeType {
        return this.props.type
    }

    public get line(): number {
        return this.props.line
    }

    public get column(): number {
        return this.props.column
    }

    public get context(): string {
        return this.props.context
    }

    public isMagicNumber(): boolean {
        return this.props.type === HARDCODE_TYPES.MAGIC_NUMBER
    }

    public isMagicString(): boolean {
        return this.props.type === HARDCODE_TYPES.MAGIC_STRING
    }

    public suggestConstantName(): string {
        if (this.isMagicNumber()) {
            return this.suggestNumberConstantName()
        }
        if (this.isMagicString()) {
            return this.suggestStringConstantName()
        }
        return CONSTANT_NAMES.UNKNOWN_CONSTANT
    }

    private suggestNumberConstantName(): string {
        const value = this.props.value
        const context = this.props.context.toLowerCase()

        if (context.includes(SUGGESTION_KEYWORDS.TIMEOUT)) {
            return CONSTANT_NAMES.TIMEOUT_MS
        }
        if (
            context.includes(SUGGESTION_KEYWORDS.RETRY) ||
            context.includes(SUGGESTION_KEYWORDS.ATTEMPT)
        ) {
            return CONSTANT_NAMES.MAX_RETRIES
        }
        if (
            context.includes(SUGGESTION_KEYWORDS.LIMIT) ||
            context.includes(SUGGESTION_KEYWORDS.MAX)
        ) {
            return CONSTANT_NAMES.MAX_LIMIT
        }
        if (context.includes(SUGGESTION_KEYWORDS.PORT)) {
            return CONSTANT_NAMES.DEFAULT_PORT
        }
        if (context.includes(SUGGESTION_KEYWORDS.DELAY)) {
            return CONSTANT_NAMES.DELAY_MS
        }

        return `${CONSTANT_NAMES.MAGIC_NUMBER}_${String(value)}`
    }

    private suggestStringConstantName(): string {
        const value = String(this.props.value)
        const context = this.props.context.toLowerCase()

        if (value.includes(SUGGESTION_KEYWORDS.HTTP)) {
            return CONSTANT_NAMES.API_BASE_URL
        }
        if (value.includes(".") && !value.includes(" ")) {
            if (value.includes("/")) {
                return CONSTANT_NAMES.DEFAULT_PATH
            }
            return CONSTANT_NAMES.DEFAULT_DOMAIN
        }
        if (
            context.includes(SUGGESTION_KEYWORDS.ERROR) ||
            context.includes(SUGGESTION_KEYWORDS.MESSAGE)
        ) {
            return CONSTANT_NAMES.ERROR_MESSAGE
        }
        if (context.includes(SUGGESTION_KEYWORDS.DEFAULT)) {
            return CONSTANT_NAMES.DEFAULT_VALUE
        }

        return CONSTANT_NAMES.MAGIC_STRING
    }

    public suggestLocation(currentLayer?: string): string {
        if (!currentLayer) {
            return LOCATIONS.SHARED_CONSTANTS
        }

        const context = this.props.context.toLowerCase()

        if (
            context.includes(SUGGESTION_KEYWORDS.ENTITY) ||
            context.includes(SUGGESTION_KEYWORDS.AGGREGATE) ||
            context.includes(SUGGESTION_KEYWORDS.DOMAIN)
        ) {
            return currentLayer ? `${currentLayer}/constants` : LOCATIONS.DOMAIN_CONSTANTS
        }

        if (
            context.includes(SUGGESTION_KEYWORDS.CONFIG) ||
            context.includes(SUGGESTION_KEYWORDS.ENV)
        ) {
            return LOCATIONS.INFRASTRUCTURE_CONFIG
        }

        return LOCATIONS.SHARED_CONSTANTS
    }
}
