import * as path from "node:path"
import type { IStorage } from "../../domain/services/IStorage.js"
import type { IndexingStats, IndexProgress } from "../../domain/services/IIndexer.js"
import { FileScanner } from "../../infrastructure/indexer/FileScanner.js"
import { ASTParser } from "../../infrastructure/indexer/ASTParser.js"
import { MetaAnalyzer } from "../../infrastructure/indexer/MetaAnalyzer.js"
import { IndexBuilder } from "../../infrastructure/indexer/IndexBuilder.js"
import { createFileData, type FileData } from "../../domain/value-objects/FileData.js"
import type { FileAST } from "../../domain/value-objects/FileAST.js"
import { md5 } from "../../shared/utils/hash.js"

/**
 * Options for indexing a project.
 */
export interface IndexProjectOptions {
    /** Additional ignore patterns */
    additionalIgnore?: string[]
    /** Progress callback */
    onProgress?: (progress: IndexProgress) => void
}

/**
 * Use case for indexing a project.
 * Orchestrates the full indexing pipeline:
 * 1. Scan files
 * 2. Parse AST
 * 3. Analyze metadata
 * 4. Build indexes
 * 5. Store in Redis
 */
export class IndexProject {
    private readonly storage: IStorage
    private readonly scanner: FileScanner
    private readonly parser: ASTParser
    private readonly metaAnalyzer: MetaAnalyzer
    private readonly indexBuilder: IndexBuilder

    constructor(storage: IStorage, projectRoot: string) {
        this.storage = storage
        this.scanner = new FileScanner()
        this.parser = new ASTParser()
        this.metaAnalyzer = new MetaAnalyzer(projectRoot)
        this.indexBuilder = new IndexBuilder(projectRoot)
    }

    /**
     * Execute the indexing pipeline.
     *
     * @param projectRoot - Absolute path to project root
     * @param options - Optional configuration
     * @returns Indexing statistics
     */
    async execute(projectRoot: string, options: IndexProjectOptions = {}): Promise<IndexingStats> {
        const startTime = Date.now()
        const stats: IndexingStats = {
            filesScanned: 0,
            filesParsed: 0,
            parseErrors: 0,
            timeMs: 0,
        }

        const fileDataMap = new Map<string, FileData>()
        const astMap = new Map<string, FileAST>()
        const contentMap = new Map<string, string>()

        // Phase 1: Scanning
        this.reportProgress(options.onProgress, 0, 0, "", "scanning")

        const scanResults = await this.scanner.scanAll(projectRoot)
        stats.filesScanned = scanResults.length

        // Phase 2: Parsing
        let current = 0
        const total = scanResults.length

        for (const scanResult of scanResults) {
            current++
            const fullPath = path.join(projectRoot, scanResult.path)
            this.reportProgress(options.onProgress, current, total, scanResult.path, "parsing")

            const content = await FileScanner.readFileContent(fullPath)
            if (!content) {
                continue
            }

            contentMap.set(scanResult.path, content)

            const lines = content.split("\n")
            const hash = md5(content)

            const fileData = createFileData(lines, hash, scanResult.size, scanResult.lastModified)
            fileDataMap.set(scanResult.path, fileData)

            const language = this.detectLanguage(scanResult.path)
            if (!language) {
                continue
            }

            const ast = this.parser.parse(content, language)
            astMap.set(scanResult.path, ast)

            stats.filesParsed++
            if (ast.parseError) {
                stats.parseErrors++
            }
        }

        // Phase 3: Analyzing metadata
        current = 0
        for (const [filePath, ast] of astMap) {
            current++
            this.reportProgress(options.onProgress, current, astMap.size, filePath, "analyzing")

            const content = contentMap.get(filePath)
            if (!content) {
                continue
            }

            const fullPath = path.join(projectRoot, filePath)
            const meta = this.metaAnalyzer.analyze(fullPath, ast, content, astMap)

            await this.storage.setMeta(filePath, meta)
        }

        // Phase 4: Building indexes
        this.reportProgress(options.onProgress, 1, 1, "Building indexes", "indexing")

        const symbolIndex = this.indexBuilder.buildSymbolIndex(astMap)
        const depsGraph = this.indexBuilder.buildDepsGraph(astMap)

        // Phase 5: Store everything
        for (const [filePath, fileData] of fileDataMap) {
            await this.storage.setFile(filePath, fileData)
        }

        for (const [filePath, ast] of astMap) {
            await this.storage.setAST(filePath, ast)
        }

        await this.storage.setSymbolIndex(symbolIndex)
        await this.storage.setDepsGraph(depsGraph)

        // Store last indexed timestamp
        await this.storage.setProjectConfig("last_indexed", Date.now())

        stats.timeMs = Date.now() - startTime

        return stats
    }

    /**
     * Detect language from file extension.
     */
    private detectLanguage(filePath: string): "ts" | "tsx" | "js" | "jsx" | null {
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

    /**
     * Report progress to callback if provided.
     */
    private reportProgress(
        callback: ((progress: IndexProgress) => void) | undefined,
        current: number,
        total: number,
        currentFile: string,
        phase: IndexProgress["phase"],
    ): void {
        if (callback) {
            callback({ current, total, currentFile, phase })
        }
    }
}
