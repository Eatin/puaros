import { ValueObject } from "./ValueObject"
import { DETECTION_PATTERNS, HARDCODE_TYPES } from "../../shared/constants/rules"
import {
    API_KEY_CONTEXT_KEYWORDS,
    BASE64_CONTEXT_KEYWORDS,
    COLOR_CONTEXT_KEYWORDS,
    CONFIG_CONTEXT_KEYWORDS,
    CONSTANT_NAMES,
    DATE_CONTEXT_KEYWORDS,
    EMAIL_CONTEXT_KEYWORDS,
    FILE_PATH_CONTEXT_KEYWORDS,
    IP_CONTEXT_KEYWORDS,
    LOCATIONS,
    SUGGESTION_KEYWORDS,
    URL_CONTEXT_KEYWORDS,
    UUID_CONTEXT_KEYWORDS,
    VERSION_CONTEXT_KEYWORDS,
} from "../constants/Suggestions"

export type HardcodeType = (typeof HARDCODE_TYPES)[keyof typeof HARDCODE_TYPES]

export type ValueType =
    | "email"
    | "url"
    | "ip_address"
    | "file_path"
    | "date"
    | "api_key"
    | "uuid"
    | "version"
    | "color"
    | "mac_address"
    | "base64"
    | "config"
    | "generic"

export type ValueImportance = "critical" | "high" | "medium" | "low"

export interface DuplicateLocation {
    file: string
    line: number
}

interface HardcodedValueProps {
    readonly value: string | number | boolean
    readonly type: HardcodeType
    readonly valueType?: ValueType
    readonly line: number
    readonly column: number
    readonly context: string
    readonly duplicateLocations?: DuplicateLocation[]
    readonly withinFileUsageCount?: number
}

/**
 * Represents a hardcoded value found in source code
 */
export class HardcodedValue extends ValueObject<HardcodedValueProps> {
    private constructor(props: HardcodedValueProps) {
        super(props)
    }

    public static create(
        value: string | number | boolean,
        type: HardcodeType,
        line: number,
        column: number,
        context: string,
        valueType?: ValueType,
        duplicateLocations?: DuplicateLocation[],
        withinFileUsageCount?: number,
    ): HardcodedValue {
        return new HardcodedValue({
            value,
            type,
            valueType,
            line,
            column,
            context,
            duplicateLocations,
            withinFileUsageCount,
        })
    }

    public get value(): string | number | boolean {
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

    public get valueType(): ValueType | undefined {
        return this.props.valueType
    }

    public get duplicateLocations(): DuplicateLocation[] | undefined {
        return this.props.duplicateLocations
    }

    public get withinFileUsageCount(): number | undefined {
        return this.props.withinFileUsageCount
    }

    public hasDuplicates(): boolean {
        return (
            this.props.duplicateLocations !== undefined && this.props.duplicateLocations.length > 0
        )
    }

    public isAlmostConstant(): boolean {
        return this.props.withinFileUsageCount !== undefined && this.props.withinFileUsageCount >= 2
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

    // eslint-disable-next-line complexity, max-lines-per-function
    private suggestStringConstantName(): string {
        const value = String(this.props.value)
        const context = this.props.context.toLowerCase()
        const valueType = this.props.valueType

        if (valueType === "email") {
            if (context.includes(EMAIL_CONTEXT_KEYWORDS.ADMIN)) {
                return CONSTANT_NAMES.ADMIN_EMAIL
            }
            if (context.includes(EMAIL_CONTEXT_KEYWORDS.SUPPORT)) {
                return CONSTANT_NAMES.SUPPORT_EMAIL
            }
            if (
                context.includes(EMAIL_CONTEXT_KEYWORDS.NOREPLY) ||
                context.includes(EMAIL_CONTEXT_KEYWORDS.NO_REPLY)
            ) {
                return CONSTANT_NAMES.NOREPLY_EMAIL
            }
            return CONSTANT_NAMES.DEFAULT_EMAIL
        }

        if (valueType === "api_key") {
            if (context.includes(API_KEY_CONTEXT_KEYWORDS.SECRET)) {
                return CONSTANT_NAMES.API_SECRET_KEY
            }
            if (context.includes(API_KEY_CONTEXT_KEYWORDS.PUBLIC)) {
                return CONSTANT_NAMES.API_PUBLIC_KEY
            }
            return CONSTANT_NAMES.API_KEY
        }

        if (valueType === "url") {
            if (context.includes(URL_CONTEXT_KEYWORDS.API)) {
                return CONSTANT_NAMES.API_BASE_URL
            }
            if (
                context.includes(URL_CONTEXT_KEYWORDS.DATABASE) ||
                context.includes(URL_CONTEXT_KEYWORDS.DB)
            ) {
                return CONSTANT_NAMES.DATABASE_URL
            }
            if (context.includes(URL_CONTEXT_KEYWORDS.MONGO)) {
                return CONSTANT_NAMES.MONGODB_CONNECTION_STRING
            }
            if (
                context.includes(URL_CONTEXT_KEYWORDS.POSTGRES) ||
                context.includes(URL_CONTEXT_KEYWORDS.PG)
            ) {
                return CONSTANT_NAMES.POSTGRES_URL
            }
            return CONSTANT_NAMES.BASE_URL
        }

        if (valueType === "ip_address") {
            if (context.includes(IP_CONTEXT_KEYWORDS.SERVER)) {
                return CONSTANT_NAMES.SERVER_IP
            }
            if (
                context.includes(URL_CONTEXT_KEYWORDS.DATABASE) ||
                context.includes(URL_CONTEXT_KEYWORDS.DB)
            ) {
                return CONSTANT_NAMES.DATABASE_HOST
            }
            if (context.includes(IP_CONTEXT_KEYWORDS.REDIS)) {
                return CONSTANT_NAMES.REDIS_HOST
            }
            return CONSTANT_NAMES.HOST_IP
        }

        if (valueType === "file_path") {
            if (context.includes(FILE_PATH_CONTEXT_KEYWORDS.LOG)) {
                return CONSTANT_NAMES.LOG_FILE_PATH
            }
            if (context.includes(SUGGESTION_KEYWORDS.CONFIG)) {
                return CONSTANT_NAMES.CONFIG_FILE_PATH
            }
            if (context.includes(FILE_PATH_CONTEXT_KEYWORDS.DATA)) {
                return CONSTANT_NAMES.DATA_DIR_PATH
            }
            if (context.includes(FILE_PATH_CONTEXT_KEYWORDS.TEMP)) {
                return CONSTANT_NAMES.TEMP_DIR_PATH
            }
            return CONSTANT_NAMES.FILE_PATH
        }

        if (valueType === "date") {
            if (context.includes(DATE_CONTEXT_KEYWORDS.DEADLINE)) {
                return CONSTANT_NAMES.DEADLINE
            }
            if (context.includes(DATE_CONTEXT_KEYWORDS.START)) {
                return CONSTANT_NAMES.START_DATE
            }
            if (context.includes(DATE_CONTEXT_KEYWORDS.END)) {
                return CONSTANT_NAMES.END_DATE
            }
            if (context.includes(DATE_CONTEXT_KEYWORDS.EXPIR)) {
                return CONSTANT_NAMES.EXPIRATION_DATE
            }
            return CONSTANT_NAMES.DEFAULT_DATE
        }

        if (valueType === "uuid") {
            if (
                context.includes(UUID_CONTEXT_KEYWORDS.ID) ||
                context.includes(UUID_CONTEXT_KEYWORDS.IDENTIFIER)
            ) {
                return CONSTANT_NAMES.DEFAULT_ID
            }
            if (context.includes(UUID_CONTEXT_KEYWORDS.REQUEST)) {
                return CONSTANT_NAMES.REQUEST_ID
            }
            if (context.includes(UUID_CONTEXT_KEYWORDS.SESSION)) {
                return CONSTANT_NAMES.SESSION_ID
            }
            return CONSTANT_NAMES.UUID_CONSTANT
        }

        if (valueType === "version") {
            if (context.includes(URL_CONTEXT_KEYWORDS.API)) {
                return CONSTANT_NAMES.API_VERSION
            }
            if (context.includes(VERSION_CONTEXT_KEYWORDS.APP)) {
                return CONSTANT_NAMES.APP_VERSION
            }
            return CONSTANT_NAMES.VERSION
        }

        if (valueType === "color") {
            if (context.includes(COLOR_CONTEXT_KEYWORDS.PRIMARY)) {
                return CONSTANT_NAMES.PRIMARY_COLOR
            }
            if (context.includes(COLOR_CONTEXT_KEYWORDS.SECONDARY)) {
                return CONSTANT_NAMES.SECONDARY_COLOR
            }
            if (context.includes(COLOR_CONTEXT_KEYWORDS.BACKGROUND)) {
                return CONSTANT_NAMES.BACKGROUND_COLOR
            }
            return CONSTANT_NAMES.COLOR_CONSTANT
        }

        if (valueType === "mac_address") {
            return CONSTANT_NAMES.MAC_ADDRESS
        }

        if (valueType === "base64") {
            if (context.includes(BASE64_CONTEXT_KEYWORDS.TOKEN)) {
                return CONSTANT_NAMES.ENCODED_TOKEN
            }
            if (context.includes(BASE64_CONTEXT_KEYWORDS.KEY)) {
                return CONSTANT_NAMES.ENCODED_KEY
            }
            return CONSTANT_NAMES.BASE64_VALUE
        }

        if (valueType === "config") {
            if (context.includes(CONFIG_CONTEXT_KEYWORDS.ENDPOINT)) {
                return CONSTANT_NAMES.API_ENDPOINT
            }
            if (context.includes(CONFIG_CONTEXT_KEYWORDS.ROUTE)) {
                return CONSTANT_NAMES.ROUTE_PATH
            }
            if (context.includes(CONFIG_CONTEXT_KEYWORDS.CONNECTION)) {
                return CONSTANT_NAMES.CONNECTION_STRING
            }
            return CONSTANT_NAMES.CONFIG_VALUE
        }

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
        const valueType = this.props.valueType

        if (valueType === "api_key" || valueType === "url" || valueType === "ip_address") {
            return LOCATIONS.CONFIG_ENVIRONMENT
        }

        if (valueType === "email") {
            return LOCATIONS.CONFIG_CONTACTS
        }

        if (valueType === "file_path") {
            return LOCATIONS.CONFIG_PATHS
        }

        if (valueType === "date") {
            return LOCATIONS.CONFIG_DATES
        }

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

    public getDetailedSuggestion(currentLayer?: string): string {
        const constantName = this.suggestConstantName()
        const location = this.suggestLocation(currentLayer)
        const valueTypeLabel = this.valueType ? ` (${this.valueType})` : ""

        let suggestion = `Extract${valueTypeLabel} to constant ${constantName} in ${location}`

        if (this.isAlmostConstant() && this.withinFileUsageCount) {
            suggestion += `. This value appears ${String(this.withinFileUsageCount)} times in this file`
        }

        if (this.hasDuplicates() && this.duplicateLocations) {
            const count = this.duplicateLocations.length
            const fileList = this.duplicateLocations
                .slice(0, 3)
                .map((loc) => `${loc.file}:${String(loc.line)}`)
                .join(", ")

            const more = count > 3 ? ` and ${String(count - 3)} more` : ""
            suggestion += `. Also duplicated in ${String(count)} other file(s): ${fileList}${more}`
        }

        return suggestion
    }

    /**
     * Analyzes variable name and context to determine importance
     */
    public getImportance(): ValueImportance {
        const context = this.props.context.toLowerCase()
        const valueType = this.props.valueType

        if (valueType === "api_key") {
            return "critical"
        }

        const criticalKeywords = [
            ...DETECTION_PATTERNS.SENSITIVE_KEYWORDS,
            ...DETECTION_PATTERNS.BUSINESS_KEYWORDS,
            "key",
            "age",
        ]

        if (criticalKeywords.some((keyword) => context.includes(keyword))) {
            return "critical"
        }

        const highKeywords = [...DETECTION_PATTERNS.TECHNICAL_KEYWORDS, "db", "api"]

        if (highKeywords.some((keyword) => context.includes(keyword))) {
            return "high"
        }

        if (valueType === "url" || valueType === "ip_address" || valueType === "email") {
            return "high"
        }

        const mediumKeywords = DETECTION_PATTERNS.MEDIUM_KEYWORDS

        if (mediumKeywords.some((keyword) => context.includes(keyword))) {
            return "medium"
        }

        const lowKeywords = DETECTION_PATTERNS.UI_KEYWORDS

        if (lowKeywords.some((keyword) => context.includes(keyword))) {
            return "low"
        }

        return "medium"
    }

    /**
     * Checks if this violation should be skipped based on layer strictness
     *
     * Different layers have different tolerance levels:
     * - domain: strictest (no hardcoded values allowed)
     * - application: strict (only low importance allowed)
     * - infrastructure: moderate (low and some medium allowed)
     * - cli: lenient (UI constants allowed)
     */
    public shouldSkip(layer?: string): boolean {
        if (!layer) {
            return false
        }

        const importance = this.getImportance()

        if (layer === "domain") {
            return false
        }

        if (layer === "application") {
            return false
        }

        if (layer === "infrastructure") {
            return importance === "low" && this.isUIConstant()
        }

        if (layer === "cli") {
            return importance === "low" && this.isUIConstant()
        }

        return false
    }

    /**
     * Checks if this value is a UI-related constant
     */
    private isUIConstant(): boolean {
        const context = this.props.context.toLowerCase()

        const uiKeywords = DETECTION_PATTERNS.UI_KEYWORDS

        return uiKeywords.some((keyword) => context.includes(keyword))
    }
}
