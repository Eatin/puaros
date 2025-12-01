# ipuaro TODO

## Completed

### Version 0.1.0 - Foundation
- [x] Project setup (package.json, tsconfig, vitest)
- [x] Domain entities (Session, Project)
- [x] Domain value objects (FileData, FileAST, FileMeta, ChatMessage, etc.)
- [x] Domain service interfaces (IStorage, ILLMClient, ITool, IIndexer)
- [x] Shared config loader with Zod validation
- [x] IpuaroError class

### Version 0.2.0 - Redis Storage
- [x] RedisClient with AOF config
- [x] Redis schema implementation
- [x] RedisStorage class

### Version 0.3.0 - Indexer
- [x] FileScanner with gitignore support
- [x] ASTParser with tree-sitter
- [x] MetaAnalyzer for complexity
- [x] IndexBuilder for symbols
- [x] Watchdog for file changes

### Version 0.4.0 - LLM Integration
- [x] OllamaClient implementation
- [x] System prompt design
- [x] Tool definitions (18 tools)
- [x] Response parser (XML format)

### Version 0.5.0 - Read Tools
- [x] ToolRegistry implementation
- [x] get_lines tool
- [x] get_function tool
- [x] get_class tool
- [x] get_structure tool

### Version 0.6.0 - Edit Tools
- [x] edit_lines tool
- [x] create_file tool
- [x] delete_file tool

### Version 0.7.0 - Search Tools
- [x] find_references tool
- [x] find_definition tool

### Version 0.8.0 - Analysis Tools
- [x] get_dependencies tool
- [x] get_dependents tool
- [x] get_complexity tool
- [x] get_todos tool

### Version 0.9.0 - Git & Run Tools
- [x] git_status tool
- [x] git_diff tool
- [x] git_commit tool
- [x] CommandSecurity (blacklist/whitelist)
- [x] run_command tool
- [x] run_tests tool

### Version 0.10.0 - Session Management
- [x] ISessionStorage interface
- [x] RedisSessionStorage implementation
- [x] ContextManager use case
- [x] StartSession use case
- [x] HandleMessage use case
- [x] UndoChange use case

## In Progress

### Version 0.11.0 - TUI Basic
- [ ] App shell (Ink/React)
- [ ] StatusBar component
- [ ] Chat component
- [ ] Input component

## Planned

### Version 0.12.0 - TUI Advanced
- [ ] DiffView component
- [ ] ConfirmDialog component
- [ ] ErrorDialog component
- [ ] Progress component

### Version 0.13.0+ - Commands & Polish
- [ ] Slash commands (/help, /clear, /undo, /sessions, /status)
- [ ] Hotkeys (Ctrl+C, Ctrl+D, Ctrl+Z)
- [ ] Auto-compression at 80% context

### Version 0.14.0 - CLI Entry Point
- [ ] Full CLI commands (start, init, index)
- [ ] Onboarding flow (Redis check, Ollama check, model pull)

## Technical Debt

_None at this time._

## Ideas for Future

- Plugin system for custom tools
- Multiple LLM providers (OpenAI, Anthropic)
- IDE integration (LSP)
- Web UI option
- Parallel AST parsing
- Response caching

---

**Last Updated:** 2025-12-01