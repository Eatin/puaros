import { LAYERS } from "../../shared/constants/rules"

/**
 * Analyzes files to determine their role in the repository pattern
 *
 * Identifies repository interfaces and use cases based on file paths
 * and architectural layer conventions.
 */
export class RepositoryFileAnalyzer {
    /**
     * Checks if a file is a repository interface
     */
    public isRepositoryInterface(filePath: string, layer: string | undefined): boolean {
        if (layer !== LAYERS.DOMAIN) {
            return false
        }

        return /I[A-Z]\w*Repository\.ts$/.test(filePath) && /repositories?\//.test(filePath)
    }

    /**
     * Checks if a file is a use case
     */
    public isUseCase(filePath: string, layer: string | undefined): boolean {
        if (layer !== LAYERS.APPLICATION) {
            return false
        }

        return /use-cases?\//.test(filePath) && /[A-Z][a-z]+[A-Z]\w*\.ts$/.test(filePath)
    }
}
