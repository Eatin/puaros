/**
 * Tool registration helper for CLI.
 * Registers all 18 tools with the tool registry.
 */

import type { IToolRegistry } from "../../application/interfaces/IToolRegistry.js"

import { GetLinesTool } from "../../infrastructure/tools/read/GetLinesTool.js"
import { GetFunctionTool } from "../../infrastructure/tools/read/GetFunctionTool.js"
import { GetClassTool } from "../../infrastructure/tools/read/GetClassTool.js"
import { GetStructureTool } from "../../infrastructure/tools/read/GetStructureTool.js"

import { EditLinesTool } from "../../infrastructure/tools/edit/EditLinesTool.js"
import { CreateFileTool } from "../../infrastructure/tools/edit/CreateFileTool.js"
import { DeleteFileTool } from "../../infrastructure/tools/edit/DeleteFileTool.js"

import { FindReferencesTool } from "../../infrastructure/tools/search/FindReferencesTool.js"
import { FindDefinitionTool } from "../../infrastructure/tools/search/FindDefinitionTool.js"

import { GetDependenciesTool } from "../../infrastructure/tools/analysis/GetDependenciesTool.js"
import { GetDependentsTool } from "../../infrastructure/tools/analysis/GetDependentsTool.js"
import { GetComplexityTool } from "../../infrastructure/tools/analysis/GetComplexityTool.js"
import { GetTodosTool } from "../../infrastructure/tools/analysis/GetTodosTool.js"

import { GitStatusTool } from "../../infrastructure/tools/git/GitStatusTool.js"
import { GitDiffTool } from "../../infrastructure/tools/git/GitDiffTool.js"
import { GitCommitTool } from "../../infrastructure/tools/git/GitCommitTool.js"

import { RunCommandTool } from "../../infrastructure/tools/run/RunCommandTool.js"
import { RunTestsTool } from "../../infrastructure/tools/run/RunTestsTool.js"

/**
 * Register all 18 tools with the tool registry.
 */
export function registerAllTools(registry: IToolRegistry): void {
    registry.register(new GetLinesTool())
    registry.register(new GetFunctionTool())
    registry.register(new GetClassTool())
    registry.register(new GetStructureTool())

    registry.register(new EditLinesTool())
    registry.register(new CreateFileTool())
    registry.register(new DeleteFileTool())

    registry.register(new FindReferencesTool())
    registry.register(new FindDefinitionTool())

    registry.register(new GetDependenciesTool())
    registry.register(new GetDependentsTool())
    registry.register(new GetComplexityTool())
    registry.register(new GetTodosTool())

    registry.register(new GitStatusTool())
    registry.register(new GitDiffTool())
    registry.register(new GitCommitTool())

    registry.register(new RunCommandTool())
    registry.register(new RunTestsTool())
}
