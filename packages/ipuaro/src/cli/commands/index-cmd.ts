/**
 * Index command implementation.
 * Indexes project without starting TUI.
 */

import * as fs from "node:fs/promises"
import * as path from "node:path"
import { RedisClient } from "../../infrastructure/storage/RedisClient.js"
import { RedisStorage } from "../../infrastructure/storage/RedisStorage.js"
import { generateProjectName } from "../../infrastructure/storage/schema.js"
import { FileScanner } from "../../infrastructure/indexer/FileScanner.js"
import { ASTParser } from "../../infrastructure/indexer/ASTParser.js"
import { MetaAnalyzer } from "../../infrastructure/indexer/MetaAnalyzer.js"
import { IndexBuilder } from "../../infrastructure/indexer/IndexBuilder.js"
import { createFileData } from "../../domain/value-objects/FileData.js"
import type { FileAST } from "../../domain/value-objects/FileAST.js"
import { type Config, DEFAULT_CONFIG } from "../../shared/constants/config.js"
import { md5 } from "../../shared/utils/hash.js"
import { checkRedis } from "./onboarding.js"

type Language = "ts" | "tsx" | "js" | "jsx"

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
    const errors: string[] = []

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
        const scanner = new FileScanner({
            onProgress: (progress): void => {
                onProgress?.("scanning", progress.current, progress.total, progress.currentFile)
            },
        })
        const astParser = new ASTParser()
        const metaAnalyzer = new MetaAnalyzer(resolvedPath)
        const indexBuilder = new IndexBuilder(resolvedPath)

        console.warn("🔍 Scanning files...")
        const files = await scanner.scanAll(resolvedPath)
        console.warn(`   Found ${String(files.length)} files\n`)

        if (files.length === 0) {
            console.warn("⚠️  No files found to index.")
            return {
                success: true,
                filesIndexed: 0,
                filesSkipped: 0,
                errors: [],
                duration: Date.now() - startTime,
            }
        }

        console.warn("📝 Parsing files...")
        const allASTs = new Map<string, FileAST>()
        const fileContents = new Map<string, string>()
        let parsed = 0
        let skipped = 0

        for (const file of files) {
            const fullPath = path.join(resolvedPath, file.path)
            const language = getLanguage(file.path)

            if (!language) {
                skipped++
                continue
            }

            try {
                const content = await fs.readFile(fullPath, "utf-8")
                const ast = astParser.parse(content, language)

                if (ast.parseError) {
                    errors.push(
                        `Parse error in ${file.path}: ${ast.parseErrorMessage ?? "unknown"}`,
                    )
                    skipped++
                    continue
                }

                allASTs.set(file.path, ast)
                fileContents.set(file.path, content)
                parsed++

                onProgress?.("parsing", parsed + skipped, files.length, file.path)

                if ((parsed + skipped) % 50 === 0) {
                    process.stdout.write(
                        `\r   Parsed ${String(parsed)} files (${String(skipped)} skipped)...`,
                    )
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error)
                errors.push(`Error reading ${file.path}: ${message}`)
                skipped++
            }
        }
        console.warn(`\r   Parsed ${String(parsed)} files (${String(skipped)} skipped)     \n`)

        console.warn("📊 Analyzing metadata...")
        let analyzed = 0
        for (const [filePath, ast] of allASTs) {
            const content = fileContents.get(filePath) ?? ""
            const meta = metaAnalyzer.analyze(
                path.join(resolvedPath, filePath),
                ast,
                content,
                allASTs,
            )

            const fileData = createFileData({
                lines: content.split("\n"),
                hash: md5(content),
                size: content.length,
                lastModified: Date.now(),
            })

            await storage.setFile(filePath, fileData)
            await storage.setAST(filePath, ast)
            await storage.setMeta(filePath, meta)

            analyzed++
            onProgress?.("analyzing", analyzed, allASTs.size, filePath)

            if (analyzed % 50 === 0) {
                process.stdout.write(
                    `\r   Analyzed ${String(analyzed)}/${String(allASTs.size)} files...`,
                )
            }
        }
        console.warn(`\r   Analyzed ${String(analyzed)} files                    \n`)

        console.warn("🏗️  Building indexes...")
        onProgress?.("storing", 0, 2)
        const symbolIndex = indexBuilder.buildSymbolIndex(allASTs)
        const depsGraph = indexBuilder.buildDepsGraph(allASTs)

        await storage.setSymbolIndex(symbolIndex)
        await storage.setDepsGraph(depsGraph)
        onProgress?.("storing", 2, 2)

        const duration = Date.now() - startTime
        const durationSec = (duration / 1000).toFixed(2)

        console.warn(`✅ Indexing complete in ${durationSec}s`)
        console.warn(`   Files indexed: ${String(parsed)}`)
        console.warn(`   Files skipped: ${String(skipped)}`)
        console.warn(`   Symbols: ${String(symbolIndex.size)}`)

        if (errors.length > 0) {
            console.warn(`\n⚠️  ${String(errors.length)} errors occurred:`)
            for (const error of errors.slice(0, 5)) {
                console.warn(`   - ${error}`)
            }
            if (errors.length > 5) {
                console.warn(`   ... and ${String(errors.length - 5)} more`)
            }
        }

        return {
            success: true,
            filesIndexed: parsed,
            filesSkipped: skipped,
            errors,
            duration,
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

/**
 * Get language from file extension.
 */
function getLanguage(filePath: string): Language | null {
    const ext = path.extname(filePath).toLowerCase()
    switch (ext) {
        case ".ts":
            return "ts"
        case ".tsx":
            return "tsx"
        case ".js":
            return "js"
        case ".jsx":
            return "jsx"
        default:
            return null
    }
}
