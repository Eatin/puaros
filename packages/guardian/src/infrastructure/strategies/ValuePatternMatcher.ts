/**
 * Pattern matcher for detecting specific value types
 *
 * Provides pattern matching for emails, IPs, paths, dates, UUIDs, versions, and other common hardcoded values
 */
export class ValuePatternMatcher {
    private static readonly EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    private static readonly IP_V4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/
    private static readonly IP_V6_PATTERN =
        /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$/
    private static readonly DATE_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/
    private static readonly URL_PATTERN = /^https?:\/\/|^mongodb:\/\/|^postgresql:\/\//
    private static readonly UNIX_PATH_PATTERN = /^\/[a-zA-Z0-9/_-]+/
    private static readonly WINDOWS_PATH_PATTERN = /^[a-zA-Z]:\\[a-zA-Z0-9\\/_-]+/
    private static readonly API_KEY_PATTERN = /^(sk_|pk_|api_|key_)[a-zA-Z0-9_-]{20,}$/
    private static readonly UUID_PATTERN =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    private static readonly SEMVER_PATTERN = /^\d+\.\d+\.\d+(-[\w.-]+)?(\+[\w.-]+)?$/
    private static readonly HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
    private static readonly MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
    private static readonly BASE64_PATTERN =
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
    private static readonly JWT_PATTERN = /^eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/

    /**
     * Checks if value is an email address
     */
    public isEmail(value: string): boolean {
        return ValuePatternMatcher.EMAIL_PATTERN.test(value)
    }

    /**
     * Checks if value is an IP address (v4 or v6)
     */
    public isIpAddress(value: string): boolean {
        return (
            ValuePatternMatcher.IP_V4_PATTERN.test(value) ||
            ValuePatternMatcher.IP_V6_PATTERN.test(value)
        )
    }

    /**
     * Checks if value is a date in ISO format
     */
    public isDate(value: string): boolean {
        return ValuePatternMatcher.DATE_ISO_PATTERN.test(value)
    }

    /**
     * Checks if value is a URL
     */
    public isUrl(value: string): boolean {
        return ValuePatternMatcher.URL_PATTERN.test(value)
    }

    /**
     * Checks if value is a file path (Unix or Windows)
     */
    public isFilePath(value: string): boolean {
        return (
            ValuePatternMatcher.UNIX_PATH_PATTERN.test(value) ||
            ValuePatternMatcher.WINDOWS_PATH_PATTERN.test(value)
        )
    }

    /**
     * Checks if value looks like an API key
     */
    public isApiKey(value: string): boolean {
        return ValuePatternMatcher.API_KEY_PATTERN.test(value)
    }

    /**
     * Checks if value is a UUID
     */
    public isUuid(value: string): boolean {
        return ValuePatternMatcher.UUID_PATTERN.test(value)
    }

    /**
     * Checks if value is a semantic version
     */
    public isSemver(value: string): boolean {
        return ValuePatternMatcher.SEMVER_PATTERN.test(value)
    }

    /**
     * Checks if value is a hex color
     */
    public isHexColor(value: string): boolean {
        return ValuePatternMatcher.HEX_COLOR_PATTERN.test(value)
    }

    /**
     * Checks if value is a MAC address
     */
    public isMacAddress(value: string): boolean {
        return ValuePatternMatcher.MAC_ADDRESS_PATTERN.test(value)
    }

    /**
     * Checks if value is Base64 encoded (min length 20 to avoid false positives)
     */
    public isBase64(value: string): boolean {
        return value.length >= 20 && ValuePatternMatcher.BASE64_PATTERN.test(value)
    }

    /**
     * Checks if value is a JWT token
     */
    public isJwt(value: string): boolean {
        return ValuePatternMatcher.JWT_PATTERN.test(value)
    }

    /**
     * Detects the type of value
     */
    public detectType(
        value: string,
    ):
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
        | null {
        if (this.isEmail(value)) {
            return "email"
        }
        if (this.isJwt(value)) {
            return "api_key"
        }
        if (this.isApiKey(value)) {
            return "api_key"
        }
        if (this.isUrl(value)) {
            return "url"
        }
        if (this.isIpAddress(value)) {
            return "ip_address"
        }
        if (this.isFilePath(value)) {
            return "file_path"
        }
        if (this.isDate(value)) {
            return "date"
        }
        if (this.isUuid(value)) {
            return "uuid"
        }
        if (this.isSemver(value)) {
            return "version"
        }
        if (this.isHexColor(value)) {
            return "color"
        }
        if (this.isMacAddress(value)) {
            return "mac_address"
        }
        if (this.isBase64(value)) {
            return "base64"
        }
        return null
    }

    /**
     * Checks if value should be detected as hardcoded
     */
    public shouldDetect(value: string): boolean {
        return (
            this.isEmail(value) ||
            this.isUrl(value) ||
            this.isIpAddress(value) ||
            this.isFilePath(value) ||
            this.isDate(value) ||
            this.isApiKey(value) ||
            this.isUuid(value) ||
            this.isSemver(value) ||
            this.isHexColor(value) ||
            this.isMacAddress(value) ||
            this.isBase64(value) ||
            this.isJwt(value)
        )
    }
}
