#!/usr/bin/env node

/**
 * ipuaro CLI entry point.
 * Local AI agent for codebase operations with infinite context feeling.
 */

import { createRequire } from "node:module"
import { Command } from "commander"
import { executeStart } from "./commands/start.js"
import { executeInit } from "./commands/init.js"
import { executeIndex } from "./commands/index-cmd.js"
import { loadConfig } from "../shared/config/loader.js"

const require = createRequire(import.meta.url)
const pkg = require("../../package.json") as { version: string }

const program = new Command()

program
    .name("ipuaro")
    .description("Local AI agent for codebase operations with infinite context feeling")
    .version(pkg.version)

program
    .command("start", { isDefault: true })
    .description("Start ipuaro TUI in the current directory")
    .argument("[path]", "Project path", ".")
    .option("--auto-apply", "Enable auto-apply mode for edits")
    .option("--model <name>", "Override LLM model")
    .action(async (projectPath: string, options: { autoApply?: boolean; model?: string }) => {
        const config = loadConfig(projectPath)
        const result = await executeStart(projectPath, options, config)
        if (!result.success) {
            process.exit(1)
        }
    })

program
    .command("init")
    .description("Create .ipuaro.json config file")
    .argument("[path]", "Project path", ".")
    .option("--force", "Overwrite existing config file")
    .action(async (projectPath: string, options: { force?: boolean }) => {
        const result = await executeInit(projectPath, options)
        if (!result.success) {
            process.exit(1)
        }
    })

program
    .command("index")
    .description("Index project without starting TUI")
    .argument("[path]", "Project path", ".")
    .action(async (projectPath: string) => {
        const config = loadConfig(projectPath)
        const result = await executeIndex(projectPath, config)
        if (!result.success) {
            process.exit(1)
        }
    })

program.parse()
