export const LAYER_PATHS = {
    DOMAIN: "/domain/",
    APPLICATION: "/application/",
    INFRASTRUCTURE: "/infrastructure/",
    SHARED: "/shared/",
} as const

export const CLI_PATHS = {
    DIST_CLI_INDEX: "../dist/cli/index.js",
} as const

export const IMPORT_PATTERNS = {
    ES_IMPORT:
        /import\s+(?:{[^}]*}|[\w*]+(?:\s+as\s+\w+)?|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g,
    REQUIRE: /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    QUOTE: /['"]/g,
} as const
