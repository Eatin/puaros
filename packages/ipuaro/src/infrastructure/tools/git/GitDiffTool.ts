import { simpleGit, type SimpleGit } from "simple-git"
import type { ITool, ToolContext, ToolParameterSchema } from "../../../domain/services/ITool.js"
import {
    createErrorResult,
    createSuccessResult,
    type ToolResult,
} from "../../../domain/value-objects/ToolResult.js"

/**
 * A single file diff entry.
 */
export interface DiffEntry {
    /** File path */
    file: string
    /** Number of insertions */
    insertions: number
    /** Number of deletions */
    deletions: number
    /** Whether the file is binary */
    binary: boolean
}

/**
 * Result data from git_diff tool.
 */
export interface GitDiffResult {
    /** Whether showing staged or all changes */
    staged: boolean
    /** Path filter applied (null if all files) */
    pathFilter: string | null
    /** Whether there are any changes */
    hasChanges: boolean
    /** Summary of changes */
    summary: {
        /** Number of files changed */
        filesChanged: number
        /** Total insertions */
        insertions: number
        /** Total deletions */
        deletions: number
    }
    /** List of changed files */
    files: DiffEntry[]
    /** Full diff text */
    diff: string
}

/**
 * Tool for getting uncommitted git changes (diff).
 * Shows what has changed but not yet committed.
 */
export class GitDiffTool implements ITool {
    readonly name = "git_diff"
    readonly description =
        "Get uncommitted changes (diff). " + "Shows what has changed but not yet committed."
    readonly parameters: ToolParameterSchema[] = [
        {
            name: "path",
            type: "string",
            description: "Limit diff to specific file or directory",
            required: false,
        },
        {
            name: "staged",
            type: "boolean",
            description: "Show only staged changes (default: false, shows all)",
            required: false,
        },
    ]
    readonly requiresConfirmation = false
    readonly category = "git" as const

    private readonly gitFactory: (basePath: string) => SimpleGit

    constructor(gitFactory?: (basePath: string) => SimpleGit) {
        this.gitFactory = gitFactory ?? ((basePath: string) => simpleGit(basePath))
    }

    validateParams(params: Record<string, unknown>): string | null {
        if (params.path !== undefined && typeof params.path !== "string") {
            return "Parameter 'path' must be a string"
        }
        if (params.staged !== undefined && typeof params.staged !== "boolean") {
            return "Parameter 'staged' must be a boolean"
        }
        return null
    }

    async execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> {
        const startTime = Date.now()
        const callId = `${this.name}-${String(startTime)}`

        const pathFilter = (params.path as string) ?? null
        const staged = (params.staged as boolean) ?? false

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

            const diffArgs = this.buildDiffArgs(staged, pathFilter)
            const diffSummary = await git.diffSummary(diffArgs)
            const diffText = await git.diff(diffArgs)

            const files: DiffEntry[] = diffSummary.files.map((f) => ({
                file: f.file,
                insertions: "insertions" in f ? f.insertions : 0,
                deletions: "deletions" in f ? f.deletions : 0,
                binary: f.binary,
            }))

            const result: GitDiffResult = {
                staged,
                pathFilter,
                hasChanges: diffSummary.files.length > 0,
                summary: {
                    filesChanged: diffSummary.files.length,
                    insertions: diffSummary.insertions,
                    deletions: diffSummary.deletions,
                },
                files,
                diff: diffText,
            }

            return createSuccessResult(callId, result, Date.now() - startTime)
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            return createErrorResult(callId, message, Date.now() - startTime)
        }
    }

    /**
     * Build diff arguments array.
     */
    private buildDiffArgs(staged: boolean, pathFilter: string | null): string[] {
        const args: string[] = []

        if (staged) {
            args.push("--cached")
        }

        if (pathFilter) {
            args.push("--", pathFilter)
        }

        return args
    }
}
