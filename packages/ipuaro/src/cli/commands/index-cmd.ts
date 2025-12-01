/**
 * Index command implementation.
 * Indexes project without starting TUI.
 */

import * as path from "node:path"
import { RedisClient } from "../../infrastructure/storage/RedisClient.js"
import { RedisStorage } from "../../infrastructure/storage/RedisStorage.js"
import { generateProjectName } from "../../infrastructure/storage/schema.js"
import { IndexProject } from "../../application/use-cases/IndexProject.js"
import { type Config, DEFAULT_CONFIG } from "../../shared/constants/config.js"
import { checkRedis } from "./onboarding.js"

/**
 * Result of index command.
 */
export interface IndexResult {
    success: boolean
    filesIndexed: number
    filesSkipped: number
    errors: string[]
    duration: number
}

/**
 * Progress callback for indexing.
 */
export type IndexProgressCallback = (
    phase: "scanning" | "parsing" | "analyzing" | "storing",
    current: number,
    total: number,
    currentFile?: string,
) => void

/**
 * Execute the index command.
 */
export async function executeIndex(
    projectPath: string,
    config: Config = DEFAULT_CONFIG,
    onProgress?: IndexProgressCallback,
): Promise<IndexResult> {
    const startTime = Date.now()
    const resolvedPath = path.resolve(projectPath)
    const projectName = generateProjectName(resolvedPath)

    console.warn(`📁 Indexing project: ${resolvedPath}`)
    console.warn(`   Project name: ${projectName}\n`)

    const redisResult = await checkRedis(config.redis)
    if (!redisResult.ok) {
        console.error(`❌ ${redisResult.error ?? "Redis unavailable"}`)
        return {
            success: false,
            filesIndexed: 0,
            filesSkipped: 0,
            errors: [redisResult.error ?? "Redis unavailable"],
            duration: Date.now() - startTime,
        }
    }

    let redisClient: RedisClient | null = null

    try {
        redisClient = new RedisClient(config.redis)
        await redisClient.connect()

        const storage = new RedisStorage(redisClient, projectName)
        const indexProject = new IndexProject(storage, resolvedPath)

        let lastPhase: "scanning" | "parsing" | "analyzing" | "indexing" = "scanning"
        let lastProgress = 0

        const stats = await indexProject.execute(resolvedPath, {
            onProgress: (progress) => {
                if (progress.phase !== lastPhase) {
                    if (lastPhase === "scanning") {
                        console.warn(`   Found ${String(progress.total)} files\n`)
                    } else if (lastProgress > 0) {
                        console.warn("")
                    }

                    const phaseLabels = {
                        scanning: "🔍 Scanning files...",
                        parsing: "📝 Parsing files...",
                        analyzing: "📊 Analyzing metadata...",
                        indexing: "🏗️  Building indexes...",
                    }
                    console.warn(phaseLabels[progress.phase])
                    lastPhase = progress.phase
                }

                if (progress.phase === "indexing") {
                    onProgress?.("storing", progress.current, progress.total)
                } else {
                    onProgress?.(
                        progress.phase,
                        progress.current,
                        progress.total,
                        progress.currentFile,
                    )
                }

                if (
                    progress.current % 50 === 0 &&
                    progress.phase !== "scanning" &&
                    progress.phase !== "indexing"
                ) {
                    process.stdout.write(
                        `\r   ${progress.phase === "parsing" ? "Parsed" : "Analyzed"} ${String(progress.current)}/${String(progress.total)} files...`,
                    )
                }
                lastProgress = progress.current
            },
        })

        const symbolIndex = await storage.getSymbolIndex()
        const durationSec = (stats.timeMs / 1000).toFixed(2)

        console.warn(`\n✅ Indexing complete in ${durationSec}s`)
        console.warn(`   Files scanned: ${String(stats.filesScanned)}`)
        console.warn(`   Files parsed: ${String(stats.filesParsed)}`)
        console.warn(`   Parse errors: ${String(stats.parseErrors)}`)
        console.warn(`   Symbols: ${String(symbolIndex.size)}`)

        return {
            success: true,
            filesIndexed: stats.filesParsed,
            filesSkipped: stats.filesScanned - stats.filesParsed,
            errors: [],
            duration: stats.timeMs,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`❌ Indexing failed: ${message}`)
        return {
            success: false,
            filesIndexed: 0,
            filesSkipped: 0,
            errors: [message],
            duration: Date.now() - startTime,
        }
    } finally {
        if (redisClient) {
            await redisClient.disconnect()
        }
    }
}
