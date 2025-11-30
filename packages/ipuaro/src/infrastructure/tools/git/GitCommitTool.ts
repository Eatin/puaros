import { type CommitResult, type SimpleGit, simpleGit } from "simple-git"
import type { ITool, ToolContext, ToolParameterSchema } from "../../../domain/services/ITool.js"
import {
    createErrorResult,
    createSuccessResult,
    type ToolResult,
} from "../../../domain/value-objects/ToolResult.js"

/**
 * Author information.
 */
export interface CommitAuthor {
    name: string
    email: string
}

/**
 * Result data from git_commit tool.
 */
export interface GitCommitResult {
    /** Commit hash */
    hash: string
    /** Current branch */
    branch: string
    /** Commit message */
    message: string
    /** Number of files changed */
    filesChanged: number
    /** Number of insertions */
    insertions: number
    /** Number of deletions */
    deletions: number
    /** Author information */
    author: CommitAuthor | null
}

/**
 * Tool for creating git commits.
 * Requires confirmation before execution.
 */
export class GitCommitTool implements ITool {
    readonly name = "git_commit"
    readonly description =
        "Create a git commit with the specified message. " +
        "Will ask for confirmation. Optionally stage specific files first."
    readonly parameters: ToolParameterSchema[] = [
        {
            name: "message",
            type: "string",
            description: "Commit message",
            required: true,
        },
        {
            name: "files",
            type: "array",
            description: "Files to stage before commit (optional, defaults to all staged)",
            required: false,
        },
    ]
    readonly requiresConfirmation = true
    readonly category = "git" as const

    private readonly gitFactory: (basePath: string) => SimpleGit

    constructor(gitFactory?: (basePath: string) => SimpleGit) {
        this.gitFactory = gitFactory ?? ((basePath: string) => simpleGit(basePath))
    }

    validateParams(params: Record<string, unknown>): string | null {
        if (params.message === undefined) {
            return "Parameter 'message' is required"
        }
        if (typeof params.message !== "string") {
            return "Parameter 'message' must be a string"
        }
        if (params.message.trim() === "") {
            return "Parameter 'message' cannot be empty"
        }
        if (params.files !== undefined) {
            if (!Array.isArray(params.files)) {
                return "Parameter 'files' must be an array"
            }
            for (const file of params.files) {
                if (typeof file !== "string") {
                    return "Parameter 'files' must be an array of strings"
                }
            }
        }
        return null
    }

    async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        const startTime = Date.now()
        const callId = `${this.name}-${String(startTime)}`

        const message = params.message as string
        const files = params.files as string[] | undefined

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

            if (files && files.length > 0) {
                await git.add(files)
            }

            const status = await git.status()
            if (status.staged.length === 0 && (!files || files.length === 0)) {
                return createErrorResult(
                    callId,
                    "Nothing to commit. Stage files first with 'git add' or provide 'files' parameter.",
                    Date.now() - startTime,
                )
            }

            const commitSummary = `Committing ${String(status.staged.length)} file(s): ${message}`
            const confirmed = await ctx.requestConfirmation(commitSummary)

            if (!confirmed) {
                return createErrorResult(callId, "Commit cancelled by user", Date.now() - startTime)
            }

            const commitResult = await git.commit(message)
            const result = this.formatCommitResult(commitResult, message)

            return createSuccessResult(callId, result, Date.now() - startTime)
        } catch (error) {
            const message_ = error instanceof Error ? error.message : String(error)
            return createErrorResult(callId, message_, Date.now() - startTime)
        }
    }

    /**
     * Format simple-git CommitResult into our result structure.
     */
    private formatCommitResult(commit: CommitResult, message: string): GitCommitResult {
        return {
            hash: commit.commit,
            branch: commit.branch,
            message,
            filesChanged: commit.summary.changes,
            insertions: commit.summary.insertions,
            deletions: commit.summary.deletions,
            author: commit.author ?? null,
        }
    }
}
