/**
 * CLI Constants
 *
 * Following Clean Code principles:
 * - No magic strings
 * - Single source of truth
 * - Easy to maintain and translate
 */

export const CLI_COMMANDS = {
    NAME: "guardian",
    CHECK: "check",
} as const

export const CLI_DESCRIPTIONS = {
    MAIN: "🛡️  Code quality guardian - detect hardcoded values and architecture violations",
    CHECK: "Analyze project for code quality issues",
    PATH_ARG: "Path to analyze",
    EXCLUDE_OPTION: "Directories to exclude",
    VERBOSE_OPTION: "Verbose output",
    NO_HARDCODE_OPTION: "Skip hardcode detection",
    NO_ARCHITECTURE_OPTION: "Skip architecture checks",
    MIN_SEVERITY_OPTION: "Minimum severity level (critical, high, medium, low)",
    ONLY_CRITICAL_OPTION: "Show only critical severity issues",
    LIMIT_OPTION: "Limit detailed output to specified number of violations per category",
} as const

export const CLI_OPTIONS = {
    EXCLUDE: "-e, --exclude <dirs...>",
    VERBOSE: "-v, --verbose",
    NO_HARDCODE: "--no-hardcode",
    NO_ARCHITECTURE: "--no-architecture",
    MIN_SEVERITY: "--min-severity <level>",
    ONLY_CRITICAL: "--only-critical",
    LIMIT: "-l, --limit <number>",
} as const

export const SEVERITY_DISPLAY_LABELS = {
    CRITICAL: "🔴 CRITICAL",
    HIGH: "🟠 HIGH",
    MEDIUM: "🟡 MEDIUM",
    LOW: "🟢 LOW",
} as const

export const SEVERITY_SECTION_HEADERS = {
    CRITICAL: "\n═══════════════════════════════════════════\n🔴 CRITICAL SEVERITY\n═══════════════════════════════════════════",
    HIGH: "\n═══════════════════════════════════════════\n🟠 HIGH SEVERITY\n═══════════════════════════════════════════",
    MEDIUM: "\n═══════════════════════════════════════════\n🟡 MEDIUM SEVERITY\n═══════════════════════════════════════════",
    LOW: "\n═══════════════════════════════════════════\n🟢 LOW SEVERITY\n═══════════════════════════════════════════",
} as const

export const CLI_ARGUMENTS = {
    PATH: "<path>",
} as const

export const DEFAULT_EXCLUDES = [
    "node_modules",
    "dist",
    "build",
    "coverage",
    "tests",
    "test",
    "__tests__",
    "examples",
    "**/*.test.ts",
    "**/*.test.js",
    "**/*.spec.ts",
    "**/*.spec.js",
] as const

export const CLI_MESSAGES = {
    ANALYZING: "\n🛡️  Guardian - Analyzing your code...\n",
    METRICS_HEADER: "📊 Project Metrics:",
    LAYER_DISTRIBUTION_HEADER: "\n📦 Layer Distribution:",
    VIOLATIONS_HEADER: "\n⚠️  Found",
    CIRCULAR_DEPS_HEADER: "\n🔄 Found",
    NAMING_VIOLATIONS_HEADER: "\n📝 Found",
    HARDCODE_VIOLATIONS_HEADER: "\n🔍 Found",
    NO_ISSUES: "\n✅ No issues found! Your code looks great!",
    ISSUES_TOTAL: "\n❌ Found",
    TIP: "\n💡 Tip: Fix these issues to improve code quality and maintainability.\n",
    HELP_FOOTER: "\nRun with --help for more options",
    ERROR_PREFIX: "Error analyzing project:",
} as const

export const CLI_LABELS = {
    FILES_ANALYZED: "Files analyzed:",
    TOTAL_FUNCTIONS: "Total functions:",
    TOTAL_IMPORTS: "Total imports:",
    FILES: "files",
    ARCHITECTURE_VIOLATIONS: "architecture violations:",
    CIRCULAR_DEPENDENCIES: "circular dependencies:",
    NAMING_VIOLATIONS: "naming convention violations:",
    HARDCODE_VIOLATIONS: "hardcoded values:",
    ISSUES_TOTAL: "issues total",
} as const
