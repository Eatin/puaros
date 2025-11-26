import { ValueObject } from "./ValueObject"
import { DETECTION_PATTERNS, HARDCODE_TYPES } from "../../shared/constants/rules"
import { CONSTANT_NAMES, LOCATIONS, SUGGESTION_KEYWORDS } from "../constants/Suggestions"

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

    private suggestStringConstantName(): string {
        const value = String(this.props.value)
        const context = this.props.context.toLowerCase()
        const valueType = this.props.valueType

        if (valueType === "email") {
            if (context.includes("admin")) {
                return "ADMIN_EMAIL"
            }
            if (context.includes("support")) {
                return "SUPPORT_EMAIL"
            }
            if (context.includes("noreply") || context.includes("no-reply")) {
                return "NOREPLY_EMAIL"
            }
            return "DEFAULT_EMAIL"
        }

        if (valueType === "api_key") {
            if (context.includes("secret")) {
                return "API_SECRET_KEY"
            }
            if (context.includes("public")) {
                return "API_PUBLIC_KEY"
            }
            return "API_KEY"
        }

        if (valueType === "url") {
            if (context.includes("api")) {
                return "API_BASE_URL"
            }
            if (context.includes("database") || context.includes("db")) {
                return "DATABASE_URL"
            }
            if (context.includes("mongo")) {
                return "MONGODB_CONNECTION_STRING"
            }
            if (context.includes("postgres") || context.includes("pg")) {
                return "POSTGRES_URL"
            }
            return "BASE_URL"
        }

        if (valueType === "ip_address") {
            if (context.includes("server")) {
                return "SERVER_IP"
            }
            if (context.includes("database") || context.includes("db")) {
                return "DATABASE_HOST"
            }
            if (context.includes("redis")) {
                return "REDIS_HOST"
            }
            return "HOST_IP"
        }

        if (valueType === "file_path") {
            if (context.includes("log")) {
                return "LOG_FILE_PATH"
            }
            if (context.includes("config")) {
                return "CONFIG_FILE_PATH"
            }
            if (context.includes("data")) {
                return "DATA_DIR_PATH"
            }
            if (context.includes("temp")) {
                return "TEMP_DIR_PATH"
            }
            return "FILE_PATH"
        }

        if (valueType === "date") {
            if (context.includes("deadline")) {
                return "DEADLINE"
            }
            if (context.includes("start")) {
                return "START_DATE"
            }
            if (context.includes("end")) {
                return "END_DATE"
            }
            if (context.includes("expir")) {
                return "EXPIRATION_DATE"
            }
            return "DEFAULT_DATE"
        }

        if (valueType === "uuid") {
            if (context.includes("id") || context.includes("identifier")) {
                return "DEFAULT_ID"
            }
            if (context.includes("request")) {
                return "REQUEST_ID"
            }
            if (context.includes("session")) {
                return "SESSION_ID"
            }
            return "UUID_CONSTANT"
        }

        if (valueType === "version") {
            if (context.includes("api")) {
                return "API_VERSION"
            }
            if (context.includes("app")) {
                return "APP_VERSION"
            }
            return "VERSION"
        }

        if (valueType === "color") {
            if (context.includes("primary")) {
                return "PRIMARY_COLOR"
            }
            if (context.includes("secondary")) {
                return "SECONDARY_COLOR"
            }
            if (context.includes("background")) {
                return "BACKGROUND_COLOR"
            }
            return "COLOR_CONSTANT"
        }

        if (valueType === "mac_address") {
            return "MAC_ADDRESS"
        }

        if (valueType === "base64") {
            if (context.includes("token")) {
                return "ENCODED_TOKEN"
            }
            if (context.includes("key")) {
                return "ENCODED_KEY"
            }
            return "BASE64_VALUE"
        }

        if (valueType === "config") {
            if (context.includes("endpoint")) {
                return "API_ENDPOINT"
            }
            if (context.includes("route")) {
                return "ROUTE_PATH"
            }
            if (context.includes("connection")) {
                return "CONNECTION_STRING"
            }
            return "CONFIG_VALUE"
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
            return "src/config/environment.ts"
        }

        if (valueType === "email") {
            return "src/config/contacts.ts"
        }

        if (valueType === "file_path") {
            return "src/config/paths.ts"
        }

        if (valueType === "date") {
            return "src/config/dates.ts"
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
