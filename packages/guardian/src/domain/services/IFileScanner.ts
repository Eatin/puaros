export interface FileScanOptions {
    rootDir: string
    include?: string[]
    exclude?: string[]
    extensions?: string[]
}

/**
 * Interface for scanning project files
 * Allows infrastructure implementations without domain coupling
 */
export interface IFileScanner {
    scan(options: FileScanOptions): Promise<string[]>
    readFile(filePath: string): Promise<string>
}
