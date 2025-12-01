/**
 * Start command implementation.
 * Launches the ipuaro TUI.
 */

import * as path from "node:path"
import * as readline from "node:readline"
import { render } from "ink"
import React from "react"
import { App, type AppDependencies } from "../../tui/App.js"
import { RedisClient } from "../../infrastructure/storage/RedisClient.js"
import { RedisStorage } from "../../infrastructure/storage/RedisStorage.js"
import { RedisSessionStorage } from "../../infrastructure/storage/RedisSessionStorage.js"
import { OllamaClient } from "../../infrastructure/llm/OllamaClient.js"
import { ToolRegistry } from "../../infrastructure/tools/registry.js"
import { generateProjectName } from "../../infrastructure/storage/schema.js"
import { type Config, DEFAULT_CONFIG } from "../../shared/constants/config.js"
import { checkModel, pullModel, runOnboarding } from "./onboarding.js"
import { registerAllTools } from "./tools-setup.js"

/**
 * Options for start command.
 */
export interface StartOptions {
    autoApply?: boolean
    model?: string
}

/**
 * Result of start command.
 */
export interface StartResult {
    success: boolean
    error?: string
}

/**
 * Execute the start command.
 */
export async function executeStart(
    projectPath: string,
    options: StartOptions,
    config: Config = DEFAULT_CONFIG,
): Promise<StartResult> {
    const resolvedPath = path.resolve(projectPath)
    const projectName = generateProjectName(resolvedPath)

    const llmConfig = {
        ...config.llm,
        model: options.model ?? config.llm.model,
    }

    console.warn("🔍 Running pre-flight checks...\n")

    const onboardingResult = await runOnboarding({
        redisConfig: config.redis,
        llmConfig,
        projectPath: resolvedPath,
    })

    for (const warning of onboardingResult.warnings) {
        console.warn(`⚠️  ${warning}\n`)
    }

    if (!onboardingResult.success) {
        for (const error of onboardingResult.errors) {
            console.error(`❌ ${error}\n`)
        }

        if (!onboardingResult.modelOk && onboardingResult.ollamaOk) {
            const shouldPull = await promptYesNo(
                `Would you like to pull "${llmConfig.model}"? (y/n): `,
            )

            if (shouldPull) {
                const pullResult = await pullModel(llmConfig, console.warn)
                if (!pullResult.ok) {
                    console.error(`❌ ${pullResult.error ?? "Unknown error"}`)
                    return { success: false, error: pullResult.error }
                }

                const recheckModel = await checkModel(llmConfig)
                if (!recheckModel.ok) {
                    console.error("❌ Model still not available after pull.")
                    return { success: false, error: "Model pull failed" }
                }
            } else {
                return { success: false, error: "Model not available" }
            }
        } else {
            return {
                success: false,
                error: onboardingResult.errors.join("\n"),
            }
        }
    }

    console.warn(`✅ All checks passed. Found ${String(onboardingResult.fileCount)} files.\n`)
    console.warn("🚀 Starting ipuaro...\n")

    const redisClient = new RedisClient(config.redis)

    try {
        await redisClient.connect()

        const storage = new RedisStorage(redisClient, projectName)
        const sessionStorage = new RedisSessionStorage(redisClient)
        const llm = new OllamaClient(llmConfig)
        const tools = new ToolRegistry()

        registerAllTools(tools)

        const deps: AppDependencies = {
            storage,
            sessionStorage,
            llm,
            tools,
        }

        const handleExit = (): void => {
            void redisClient.disconnect()
        }

        const { waitUntilExit } = render(
            React.createElement(App, {
                projectPath: resolvedPath,
                autoApply: options.autoApply ?? config.edit.autoApply,
                deps,
                onExit: handleExit,
            }),
        )

        await waitUntilExit()
        await redisClient.disconnect()

        return { success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`❌ Failed to start ipuaro: ${message}`)
        await redisClient.disconnect()
        return { success: false, error: message }
    }
}

/**
 * Simple yes/no prompt for CLI.
 */
async function promptYesNo(question: string): Promise<boolean> {
    return new Promise((resolve) => {
        process.stdout.write(question)

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })

        rl.once("line", (answer: string) => {
            rl.close()
            resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes")
        })
    })
}
