/**
 * Init command implementation.
 * Creates .ipuaro.json configuration file.
 */

import * as fs from "node:fs/promises"
import * as path from "node:path"

/**
 * Default configuration template for .ipuaro.json
 */
const CONFIG_TEMPLATE = {
    $schema: "https://raw.githubusercontent.com/samiyev/puaros/main/packages/ipuaro/schema.json",
    redis: {
        host: "localhost",
        port: 6379,
        db: 0,
    },
    llm: {
        provider: "ollama",
        model: "qwen2.5-coder:7b-instruct",
        temperature: 0.1,
        host: "http://localhost:11434",
        // OpenAI specific settings (uncomment to use OpenAI)
        // apiKey: "your-openai-api-key",
        // apiBase: "https://api.openai.com/v1",
    },
    project: {
        ignorePatterns: [],
    },
    edit: {
        autoApply: false,
    },
}

/**
 * Options for init command.
 */
export interface InitOptions {
    force?: boolean
}

/**
 * Result of init command.
 */
export interface InitResult {
    success: boolean
    filePath?: string
    error?: string
    skipped?: boolean
}

/**
 * Execute the init command.
 * Creates a .ipuaro.json file in the specified directory.
 */
export async function executeInit(
    projectPath = ".",
    options: InitOptions = {},
): Promise<InitResult> {
    const resolvedPath = path.resolve(projectPath)
    const configPath = path.join(resolvedPath, ".ipuaro.json")

    try {
        const exists = await fileExists(configPath)

        if (exists && !options.force) {
            console.warn(`⚠️  Configuration file already exists: ${configPath}`)
            console.warn("   Use --force to overwrite.")
            return {
                success: true,
                skipped: true,
                filePath: configPath,
            }
        }

        const dirExists = await fileExists(resolvedPath)
        if (!dirExists) {
            await fs.mkdir(resolvedPath, { recursive: true })
        }

        const content = JSON.stringify(CONFIG_TEMPLATE, null, 4)
        await fs.writeFile(configPath, content, "utf-8")

        console.warn(`✅ Created ${configPath}`)
        console.warn("\nConfiguration options:")
        console.warn("  redis.host     - Redis server host (default: localhost)")
        console.warn("  redis.port     - Redis server port (default: 6379)")
        console.warn("  llm.provider   - LLM provider (ollama or openai, default: ollama)")
        console.warn("  llm.model      - LLM model name (default: qwen2.5-coder:7b-instruct)")
        console.warn("  llm.temperature - LLM temperature (default: 0.1)")
        console.warn("  llm.host       - Ollama host (only for ollama provider, default: http://localhost:11434)")
        console.warn("  llm.apiKey     - OpenAI API key (only for openai provider)")
        console.warn("  llm.apiBase    - OpenAI API base URL (only for openai provider)")
        console.warn("  edit.autoApply - Auto-apply edits without confirmation (default: false)")
        console.warn("\nRun `ipuaro` to start the AI agent.")

        return {
            success: true,
            filePath: configPath,
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`❌ Failed to create configuration: ${message}`)
        return {
            success: false,
            error: message,
        }
    }
}

/**
 * Check if a file or directory exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath)
        return true
    } catch {
        return false
    }
}
