/**
 * Onboarding checks for CLI.
 * Validates environment before starting ipuaro.
 */

import { RedisClient } from "../../infrastructure/storage/RedisClient.js"
import { OllamaClient } from "../../infrastructure/llm/OllamaClient.js"
import { OpenAIClient } from "../../infrastructure/llm/OpenAIClient.js"
import { FileScanner } from "../../infrastructure/indexer/FileScanner.js"
import type { LLMConfig, RedisConfig } from "../../shared/constants/config.js"

/**
 * Result of onboarding checks.
 */
export interface OnboardingResult {
    success: boolean
    redisOk: boolean
    ollamaOk: boolean
    modelOk: boolean
    projectOk: boolean
    fileCount: number
    errors: string[]
    warnings: string[]
}

/**
 * Options for onboarding checks.
 */
export interface OnboardingOptions {
    redisConfig: RedisConfig
    llmConfig: LLMConfig
    projectPath: string
    maxFiles?: number
    skipRedis?: boolean
    skipOllama?: boolean
    skipModel?: boolean
    skipProject?: boolean
}

const DEFAULT_MAX_FILES = 10_000

/**
 * Check Redis availability.
 */
export async function checkRedis(config: RedisConfig): Promise<{
    ok: boolean
    error?: string
}> {
    const client = new RedisClient(config)

    try {
        await client.connect()
        const pingOk = await client.ping()
        await client.disconnect()

        if (!pingOk) {
            return {
                ok: false,
                error: "Redis ping failed. Server may be overloaded.",
            }
        }

        return { ok: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            ok: false,
            error: `Cannot connect to Redis: ${message}

Redis is required for ipuaro to store project indexes and session data.

Install Redis:
  macOS:   brew install redis && brew services start redis
  Ubuntu:  sudo apt install redis-server && sudo systemctl start redis
  Docker:  docker run -d -p 6379:6379 redis`,
        }
    }
}

/**
 * Check Ollama availability.
 */
export async function checkOllama(config: LLMConfig): Promise<{
    ok: boolean
    error?: string
}> {
    const client = new OllamaClient(config)

    try {
        const available = await client.isAvailable()

        if (!available) {
            return {
                ok: false,
                error: `Cannot connect to Ollama at ${config.host}

Ollama is required for ipuaro to process your requests using local LLMs.

Install Ollama:
  macOS:   brew install ollama && ollama serve
  Linux:   curl -fsSL https://ollama.com/install.sh | sh && ollama serve
  Manual:  https://ollama.com/download

After installing, ensure Ollama is running with: ollama serve`,
            }
        }

        return { ok: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            ok: false,
            error: `Ollama check failed: ${message}`,
        }
    }
}

/**
 * Check model availability.
 */
export async function checkModel(config: LLMConfig): Promise<{
    ok: boolean
    needsPull: boolean
    error?: string
}> {
    if (config.provider === "openai") {
        // No model check needed for OpenAI - handled by API
        return { ok: true, needsPull: false }
    }
    
    const client = new OllamaClient(config)

    try {
        const hasModel = await client.hasModel(config.model)

        if (!hasModel) {
            return {
                ok: false,
                needsPull: true,
                error: `Model "${config.model}" is not installed.

Would you like to pull it? This may take a few minutes.
Run: ollama pull ${config.model}`,
            }
        }

        return { ok: true, needsPull: false }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            ok: false,
            needsPull: false,
            error: `Model check failed: ${message}`,
        }
    }
}

/**
 * Pull model from Ollama.
 */
export async function pullModel(
    config: LLMConfig,
    onProgress?: (status: string) => void,
): Promise<{ ok: boolean; error?: string }> {
    const client = new OllamaClient(config)

    try {
        onProgress?.(`Pulling model "${config.model}"...`)
        await client.pullModel(config.model)
        onProgress?.(`Model "${config.model}" pulled successfully.`)
        return { ok: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            ok: false,
            error: `Failed to pull model: ${message}`,
        }
    }
}

/**
 * Check project size.
 */
export async function checkProjectSize(
    projectPath: string,
    maxFiles: number = DEFAULT_MAX_FILES,
): Promise<{
    ok: boolean
    fileCount: number
    warning?: string
}> {
    const scanner = new FileScanner()

    try {
        const files = await scanner.scanAll(projectPath)
        const fileCount = files.length

        if (fileCount > maxFiles) {
            return {
                ok: true,
                fileCount,
                warning: `Project has ${fileCount.toLocaleString()} files (>${maxFiles.toLocaleString()}).
This may take a while to index and use more memory.

Consider:
  1. Running ipuaro in a subdirectory: ipuaro ./src
  2. Adding patterns to .gitignore to exclude unnecessary files
  3. Using a smaller project for better performance`,
            }
        }

        if (fileCount === 0) {
            return {
                ok: false,
                fileCount: 0,
                warning: `No supported files found in "${projectPath}".

ipuaro supports: .ts, .tsx, .js, .jsx, .json, .yaml, .yml

Ensure you're running ipuaro in a project directory with source files.`,
            }
        }

        return { ok: true, fileCount }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            ok: false,
            fileCount: 0,
            warning: `Failed to scan project: ${message}`,
        }
    }
}

/**
 * Check OpenAI availability.
 */
export async function checkOpenAI(config: LLMConfig & { apiKey?: string }): Promise<{
    ok: boolean
    error?: string
}> {
    if (!config.apiKey) {
        return {
            ok: false,
            error: "OpenAI API key is missing. Please provide it in the configuration or as OPENAI_API_KEY environment variable.",
        }
    }
    
    const client = new OpenAIClient({ 
        ...config, 
        apiKey: config.apiKey, 
        apiBase: config.apiBase 
    })

    try {
        const available = await client.isAvailable()

        if (!available) {
            return {
                ok: false,
                error: `Cannot connect to OpenAI at ${config.apiBase || "https://api.openai.com/v1"}

Please ensure your API key is valid and you have network connectivity.`,
            }
        }

        return { ok: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        return {
            ok: false,
            error: `OpenAI check failed: ${message}`,
        }
    }
}

/**
 * Run all onboarding checks.
 */
export async function runOnboarding(options: OnboardingOptions): Promise<OnboardingResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES
    const { provider } = options.llmConfig

    let redisOk = true
    let ollamaOk = true
    let openaiOk = true
    let modelOk = true
    let projectOk = true
    let fileCount = 0

    if (!options.skipRedis) {
        const redisResult = await checkRedis(options.redisConfig)
        redisOk = redisResult.ok
        if (!redisOk && redisResult.error) {
            errors.push(redisResult.error)
        }
    }

    if (!options.skipOllama && provider === "ollama") {
        const ollamaResult = await checkOllama(options.llmConfig)
        ollamaOk = ollamaResult.ok
        if (!ollamaOk && ollamaResult.error) {
            errors.push(ollamaResult.error)
        }
    }

    if (provider === "openai") {
        const openaiResult = await checkOpenAI(options.llmConfig)
        openaiOk = openaiResult.ok
        if (!openaiOk && openaiResult.error) {
            errors.push(openaiResult.error)
        }
    }

    if (!options.skipModel && (provider === "ollama" ? ollamaOk : openaiOk)) {
        const modelResult = await checkModel(options.llmConfig)
        modelOk = modelResult.ok
        if (!modelOk && modelResult.error) {
            errors.push(modelResult.error)
        }
    }

    if (!options.skipProject) {
        const projectResult = await checkProjectSize(options.projectPath, maxFiles)
        projectOk = projectResult.ok
        fileCount = projectResult.fileCount
        if (projectResult.warning) {
            if (projectResult.ok) {
                warnings.push(projectResult.warning)
            } else {
                errors.push(projectResult.warning)
            }
        }
    }

    // Success condition depends on provider
    const providerOk = provider === "ollama" ? (ollamaOk && modelOk) : openaiOk
    const success = redisOk && providerOk && projectOk && errors.length === 0

    return {
        success,
        redisOk,
        ollamaOk,
        modelOk,
        projectOk,
        fileCount,
        errors,
        warnings,
    }
}
