import * as fs from "fs/promises"
import * as path from "path"
import { FileScanOptions, IFileScanner } from "../../domain/services/IFileScanner"
import { DEFAULT_EXCLUDES, DEFAULT_EXTENSIONS, FILE_ENCODING } from "../constants/defaults"
import { ERROR_MESSAGES } from "../../shared/constants"

/**
 * Scans project directory for source files
 */
export class FileScanner implements IFileScanner {
    private readonly defaultExcludes = [...DEFAULT_EXCLUDES]
    private readonly defaultExtensions = [...DEFAULT_EXTENSIONS]

    public async scan(options: FileScanOptions): Promise<string[]> {
        const {
            rootDir,
            exclude = this.defaultExcludes,
            extensions = this.defaultExtensions,
        } = options

        return this.scanDirectory(rootDir, exclude, extensions)
    }

    private async scanDirectory(
        dir: string,
        exclude: string[],
        extensions: string[],
    ): Promise<string[]> {
        const files: string[] = []

        try {
            const entries = await fs.readdir(dir, { withFileTypes: true })

            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name)

                if (this.shouldExclude(entry.name, exclude)) {
                    continue
                }

                if (entry.isDirectory()) {
                    const subFiles = await this.scanDirectory(fullPath, exclude, extensions)
                    files.push(...subFiles)
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name)
                    if (extensions.includes(ext)) {
                        files.push(fullPath)
                    }
                }
            }
        } catch (error) {
            throw new Error(`${ERROR_MESSAGES.FAILED_TO_SCAN_DIR} ${dir}: ${String(error)}`)
        }

        return files
    }

    private shouldExclude(name: string, excludePatterns: string[]): boolean {
        return excludePatterns.some((pattern) => name.includes(pattern))
    }

    public async readFile(filePath: string): Promise<string> {
        try {
            return await fs.readFile(filePath, FILE_ENCODING)
        } catch (error) {
            throw new Error(`${ERROR_MESSAGES.FAILED_TO_READ_FILE} ${filePath}: ${String(error)}`)
        }
    }
}
