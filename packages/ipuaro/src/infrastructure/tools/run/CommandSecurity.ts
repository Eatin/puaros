/**
 * Command security classification.
 */
export type CommandClassification = "allowed" | "blocked" | "requires_confirmation"

/**
 * Result of command security check.
 */
export interface SecurityCheckResult {
    /** Classification of the command */
    classification: CommandClassification
    /** Reason for the classification */
    reason: string
}

/**
 * Dangerous commands that are always blocked.
 * These commands can cause data loss or security issues.
 */
export const DEFAULT_BLACKLIST: string[] = [
    // Destructive file operations
    "rm -rf",
    "rm -r",
    "rm -fr",
    "rmdir",
    // Dangerous git operations
    "git push --force",
    "git push -f",
    "git reset --hard",
    "git clean -fd",
    "git clean -f",
    // Publishing/deployment
    "npm publish",
    "yarn publish",
    "pnpm publish",
    // System commands
    "sudo",
    "su ",
    "chmod",
    "chown",
    // Network/download commands that could be dangerous
    "| sh",
    "| bash",
    // Environment manipulation
    "export ",
    "unset ",
    // Process control
    "kill -9",
    "killall",
    "pkill",
    // Disk operations (require exact command start)
    "mkfs",
    "fdisk",
    // Other dangerous
    ":(){ :|:& };:",
    "eval ",
]

/**
 * Safe commands that don't require confirmation.
 * Matched by first word (command name).
 */
export const DEFAULT_WHITELIST: string[] = [
    // Package managers
    "npm",
    "pnpm",
    "yarn",
    "npx",
    "bun",
    // Node.js
    "node",
    "tsx",
    "ts-node",
    // Git (read operations)
    "git",
    // Build tools
    "tsc",
    "tsup",
    "esbuild",
    "vite",
    "webpack",
    "rollup",
    // Testing
    "vitest",
    "jest",
    "mocha",
    "playwright",
    "cypress",
    // Linting/formatting
    "eslint",
    "prettier",
    "biome",
    // Utilities
    "echo",
    "cat",
    "ls",
    "pwd",
    "which",
    "head",
    "tail",
    "grep",
    "find",
    "wc",
    "sort",
    "diff",
]

/**
 * Git subcommands that are safe and don't need confirmation.
 */
const SAFE_GIT_SUBCOMMANDS: string[] = [
    "status",
    "log",
    "diff",
    "show",
    "branch",
    "remote",
    "fetch",
    "pull",
    "stash",
    "tag",
    "blame",
    "ls-files",
    "ls-tree",
    "rev-parse",
    "describe",
]

/**
 * Command security checker.
 * Determines if a command is safe to execute, blocked, or requires confirmation.
 */
export class CommandSecurity {
    private readonly blacklist: string[]
    private readonly whitelist: string[]

    constructor(blacklist: string[] = DEFAULT_BLACKLIST, whitelist: string[] = DEFAULT_WHITELIST) {
        this.blacklist = blacklist.map((cmd) => cmd.toLowerCase())
        this.whitelist = whitelist.map((cmd) => cmd.toLowerCase())
    }

    /**
     * Check if a command is safe to execute.
     */
    check(command: string): SecurityCheckResult {
        const normalized = command.trim().toLowerCase()

        const blacklistMatch = this.isBlacklisted(normalized)
        if (blacklistMatch) {
            return {
                classification: "blocked",
                reason: `Command contains blocked pattern: '${blacklistMatch}'`,
            }
        }

        if (this.isWhitelisted(normalized)) {
            return {
                classification: "allowed",
                reason: "Command is in the whitelist",
            }
        }

        return {
            classification: "requires_confirmation",
            reason: "Command is not in the whitelist and requires user confirmation",
        }
    }

    /**
     * Check if command matches any blacklist pattern.
     * Returns the matched pattern or null.
     */
    private isBlacklisted(command: string): string | null {
        for (const pattern of this.blacklist) {
            if (command.includes(pattern)) {
                return pattern
            }
        }
        return null
    }

    /**
     * Check if command's first word is in the whitelist.
     */
    private isWhitelisted(command: string): boolean {
        const firstWord = this.getFirstWord(command)

        if (!this.whitelist.includes(firstWord)) {
            return false
        }

        if (firstWord === "git") {
            return this.isGitCommandSafe(command)
        }

        return true
    }

    /**
     * Check if git command is safe (read-only operations).
     */
    private isGitCommandSafe(command: string): boolean {
        const parts = command.split(/\s+/)
        if (parts.length < 2) {
            return false
        }

        const subcommand = parts[1]
        return SAFE_GIT_SUBCOMMANDS.includes(subcommand)
    }

    /**
     * Get first word from command.
     */
    private getFirstWord(command: string): string {
        const match = /^(\S+)/.exec(command)
        return match ? match[1] : ""
    }

    /**
     * Add patterns to the blacklist.
     */
    addToBlacklist(patterns: string[]): void {
        for (const pattern of patterns) {
            const normalized = pattern.toLowerCase()
            if (!this.blacklist.includes(normalized)) {
                this.blacklist.push(normalized)
            }
        }
    }

    /**
     * Add commands to the whitelist.
     */
    addToWhitelist(commands: string[]): void {
        for (const cmd of commands) {
            const normalized = cmd.toLowerCase()
            if (!this.whitelist.includes(normalized)) {
                this.whitelist.push(normalized)
            }
        }
    }

    /**
     * Get current blacklist.
     */
    getBlacklist(): string[] {
        return [...this.blacklist]
    }

    /**
     * Get current whitelist.
     */
    getWhitelist(): string[] {
        return [...this.whitelist]
    }
}
