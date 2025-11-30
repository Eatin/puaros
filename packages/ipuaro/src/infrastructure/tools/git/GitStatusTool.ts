import { simpleGit, type SimpleGit, type StatusResult } from "simple-git"
import type { ITool, ToolContext, ToolParameterSchema } from "../../../domain/services/ITool.js"
import {
    createErrorResult,
    createSuccessResult,
    type ToolResult,
} from "../../../domain/value-objects/ToolResult.js"

/**
 * File status entry in git status.
 */
export interface FileStatusEntry {
    /** Relative file path */
    path: string
    /** Working directory status (modified, deleted, etc.) */
    workingDir: string
    /** Index/staging status */
    index: string
}

/**
 * Result data from git_status tool.
 */
export interface GitStatusResult {
    /** Current branch name */
    branch: string
    /** Tracking branch (e.g., origin/main) */
    tracking: string | null
    /** Number of commits ahead of tracking */
    ahead: number
    /** Number of commits behind tracking */
    behind: number
    /** Files staged for commit */
    staged: FileStatusEntry[]
    /** Modified files not staged */
    modified: FileStatusEntry[]
    /** Untracked files */
    untracked: string[]
    /** Files with merge conflicts */
    conflicted: string[]
    /** Whether working directory is clean */
    isClean: boolean
}

/**
 * Tool for getting git repository status.
 * Returns branch info, staged/modified/untracked files.
 */
export class GitStatusTool implements ITool {
    readonly name = "git_status"
    readonly description =
        "Get current git repository status. " +
        "Returns branch name, staged files, modified files, and untracked files."
    readonly parameters: ToolParameterSchema[] = []
    readonly requiresConfirmation = false
    readonly category = "git" as const

    private readonly gitFactory: (basePath: string) => SimpleGit

    constructor(gitFactory?: (basePath: string) => SimpleGit) {
        this.gitFactory = gitFactory ?? ((basePath: string) => simpleGit(basePath))
    }

    validateParams(_params: Record<string, unknown>): string | null {
        return null
    }

    async execute(_params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        const startTime = Date.now()
        const callId = `${this.name}-${String(startTime)}`

        try {
            const git = this.gitFactory(ctx.projectRoot)

            const isRepo = await git.checkIsRepo()
            if (!isRepo) {
                return createErrorResult(
                    callId,
                    "Not a git repository. Initialize with 'git init' first.",
                    Date.now() - startTime,
                )
            }

            const status = await git.status()
            const result = this.formatStatus(status)

            return createSuccessResult(callId, result, Date.now() - startTime)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return createErrorResult(callId, message, Date.now() - startTime)
        }
    }

    /**
     * Format simple-git StatusResult into our result structure.
     */
    private formatStatus(status: StatusResult): GitStatusResult {
        const staged: FileStatusEntry[] = []
        const modified: FileStatusEntry[] = []

        for (const file of status.files) {
            const entry: FileStatusEntry = {
                path: file.path,
                workingDir: file.working_dir,
                index: file.index,
            }

            if (file.index !== " " && file.index !== "?") {
                staged.push(entry)
            }

            if (file.working_dir !== " " && file.working_dir !== "?") {
                modified.push(entry)
            }
        }

        return {
            branch: status.current ?? "HEAD (detached)",
            tracking: status.tracking ?? null,
            ahead: status.ahead,
            behind: status.behind,
            staged,
            modified,
            untracked: status.not_added,
            conflicted: status.conflicted,
            isClean: status.isClean(),
        }
    }
}
