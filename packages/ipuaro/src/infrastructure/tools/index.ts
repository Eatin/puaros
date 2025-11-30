// Tools module exports
export { ToolRegistry } from "./registry.js"

// Read tools
export { GetLinesTool, type GetLinesResult } from "./read/GetLinesTool.js"
export { GetFunctionTool, type GetFunctionResult } from "./read/GetFunctionTool.js"
export { GetClassTool, type GetClassResult } from "./read/GetClassTool.js"
export {
    GetStructureTool,
    type GetStructureResult,
    type TreeNode,
} from "./read/GetStructureTool.js"

// Edit tools
export { EditLinesTool, type EditLinesResult } from "./edit/EditLinesTool.js"
export { CreateFileTool, type CreateFileResult } from "./edit/CreateFileTool.js"
export { DeleteFileTool, type DeleteFileResult } from "./edit/DeleteFileTool.js"

// Search tools
export {
    FindReferencesTool,
    type FindReferencesResult,
    type SymbolReference,
} from "./search/FindReferencesTool.js"
export {
    FindDefinitionTool,
    type FindDefinitionResult,
    type DefinitionLocation,
} from "./search/FindDefinitionTool.js"

// Analysis tools
export {
    GetDependenciesTool,
    type GetDependenciesResult,
    type DependencyEntry,
} from "./analysis/GetDependenciesTool.js"

export {
    GetDependentsTool,
    type GetDependentsResult,
    type DependentEntry,
} from "./analysis/GetDependentsTool.js"

export {
    GetComplexityTool,
    type GetComplexityResult,
    type ComplexityEntry,
} from "./analysis/GetComplexityTool.js"

export {
    GetTodosTool,
    type GetTodosResult,
    type TodoEntry,
    type TodoType,
} from "./analysis/GetTodosTool.js"

// Git tools
export { GitStatusTool, type GitStatusResult, type FileStatusEntry } from "./git/GitStatusTool.js"

export { GitDiffTool, type GitDiffResult, type DiffEntry } from "./git/GitDiffTool.js"

export { GitCommitTool, type GitCommitResult, type CommitAuthor } from "./git/GitCommitTool.js"

// Run tools
export {
    CommandSecurity,
    DEFAULT_BLACKLIST,
    DEFAULT_WHITELIST,
    type CommandClassification,
    type SecurityCheckResult,
} from "./run/CommandSecurity.js"

export { RunCommandTool, type RunCommandResult } from "./run/RunCommandTool.js"

export { RunTestsTool, type RunTestsResult, type TestRunner } from "./run/RunTestsTool.js"
