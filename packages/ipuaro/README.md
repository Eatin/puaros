# @samiyev/ipuaro 🎩

**Local AI Agent for Codebase Operations**

"Infinite" context feeling through lazy loading - work with your entire codebase using local LLM.

[![npm version](https://badge.fury.io/js/@samiyev%2Fipuaro.svg)](https://www.npmjs.com/package/@samiyev/ipuaro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Status:** 🚧 Early Development (v0.1.0 Foundation)
>
> Core infrastructure is ready. Active development in progress.

## Vision

Work with codebases of any size using local AI:
- 📂 **Lazy Loading**: Load code on-demand, not all at once
- 🧠 **Smart Context**: AST-based understanding of your code structure
- 🔒 **100% Local**: Your code never leaves your machine
- ⚡ **Fast**: Redis persistence + tree-sitter parsing

## Planned Features

### 18 LLM Tools

| Category | Tools | Status |
|----------|-------|--------|
| **Read** | `get_lines`, `get_function`, `get_class`, `get_structure` | 🔜 v0.5.0 |
| **Edit** | `edit_lines`, `create_file`, `delete_file` | 🔜 v0.6.0 |
| **Search** | `find_references`, `find_definition` | 🔜 v0.7.0 |
| **Analysis** | `get_dependencies`, `get_dependents`, `get_complexity`, `get_todos` | 🔜 v0.8.0 |
| **Git** | `git_status`, `git_diff`, `git_commit` | 🔜 v0.9.0 |
| **Run** | `run_command`, `run_tests` | 🔜 v0.9.0 |

### Terminal UI

```
┌─ ipuaro ──────────────────────────────────────────────────┐
│ [ctx: 12%] [project: myapp] [main] [47m] ✓ Ready          │
├───────────────────────────────────────────────────────────┤
│ You: How does the authentication flow work?               │
│                                                           │
│ Assistant: Let me analyze the auth module...              │
│ [get_structure src/auth/]                                 │
│ [get_function src/auth/service.ts login]                  │
│                                                           │
│ The authentication flow works as follows:                 │
│ 1. User calls POST /auth/login                            │
│ 2. AuthService.login() validates credentials...           │
│                                                           │
│ ⏱ 3.2s │ 1,247 tokens │ 2 tool calls                     │
├───────────────────────────────────────────────────────────┤
│ > _                                                       │
└───────────────────────────────────────────────────────────┘
```

### Key Capabilities

🔍 **Smart Code Understanding**
- tree-sitter AST parsing (TypeScript, JavaScript)
- Symbol index for fast lookups
- Dependency graph analysis

💾 **Persistent Sessions**
- Redis storage with AOF persistence
- Session history across restarts
- Undo stack for file changes

🛡️ **Security**
- Command blacklist (dangerous operations blocked)
- Command whitelist (safe commands auto-approved)
- Path validation (no access outside project)

## Installation

```bash
npm install @samiyev/ipuaro
# or
pnpm add @samiyev/ipuaro
```

## Requirements

- **Node.js** >= 20.0.0
- **Redis** (for persistence)
- **Ollama** (for local LLM inference)

### Setup Ollama

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama
ollama serve

# Pull recommended model
ollama pull qwen2.5-coder:7b-instruct
```

### Setup Redis

```bash
# Install Redis (macOS)
brew install redis

# Start Redis with persistence
redis-server --appendonly yes
```

## Usage

```bash
# Start ipuaro in current directory
ipuaro

# Start in specific directory
ipuaro /path/to/project

# With custom model
ipuaro --model qwen2.5-coder:32b-instruct

# With auto-apply mode (skip edit confirmations)
ipuaro --auto-apply
```

## Commands

| Command | Description |
|---------|-------------|
| `ipuaro [path]` | Start TUI in directory |
| `ipuaro init` | Create `.ipuaro.json` config |
| `ipuaro index` | Index project without TUI |

## Configuration

Create `.ipuaro.json` in your project root:

```json
{
    "redis": {
        "host": "localhost",
        "port": 6379
    },
    "llm": {
        "model": "qwen2.5-coder:7b-instruct",
        "temperature": 0.1
    },
    "project": {
        "ignorePatterns": ["node_modules", "dist", ".git"]
    },
    "edit": {
        "autoApply": false
    }
}
```

## Architecture

Clean Architecture with clear separation:

```
@samiyev/ipuaro/
├── domain/              # Business logic (no dependencies)
│   ├── entities/        # Session, Project
│   ├── value-objects/   # FileData, FileAST, ChatMessage, etc.
│   └── services/        # IStorage, ILLMClient, ITool, IIndexer
├── application/         # Use cases & orchestration
│   ├── use-cases/       # StartSession, HandleMessage, etc.
│   └── interfaces/      # IToolRegistry
├── infrastructure/      # External implementations
│   ├── storage/         # Redis client & storage
│   ├── llm/             # Ollama client & prompts
│   ├── indexer/         # File scanner, AST parser
│   └── tools/           # 18 tool implementations
├── tui/                 # Terminal UI (Ink/React)
│   └── components/      # StatusBar, Chat, Input, etc.
├── cli/                 # CLI entry point
└── shared/              # Config, errors, utils
```

## Development Status

### ✅ Completed (v0.1.0)

- [x] Project setup (tsup, vitest, ESM)
- [x] Domain entities (Session, Project)
- [x] Value objects (FileData, FileAST, ChatMessage, etc.)
- [x] Service interfaces (IStorage, ILLMClient, ITool, IIndexer)
- [x] Shared module (Config, Errors, Utils)
- [x] CLI placeholder commands
- [x] 91 unit tests, 100% coverage

### 🔜 Next Up

- [ ] **v0.2.0** - Redis Storage
- [ ] **v0.3.0** - Indexer (file scanning, AST parsing)
- [ ] **v0.4.0** - LLM Integration (Ollama)
- [ ] **v0.5.0-0.9.0** - Tools implementation
- [ ] **v0.10.0** - Session management
- [ ] **v0.11.0** - TUI

See [ROADMAP.md](./ROADMAP.md) for detailed development plan.

## API (Coming Soon)

```typescript
import { startSession, handleMessage } from "@samiyev/ipuaro"

// Start a session
const session = await startSession({
    projectPath: "./my-project",
    model: "qwen2.5-coder:7b-instruct"
})

// Send a message
const response = await handleMessage(session, "Explain the auth flow")

console.log(response.content)
console.log(`Tokens: ${response.stats.tokens}`)
console.log(`Tool calls: ${response.stats.toolCalls}`)
```

## How It Works

### Lazy Loading Context

Instead of loading entire codebase into context:

```
Traditional approach:
├── Load all files → 500k tokens → ❌ Exceeds context window

ipuaro approach:
├── Load project structure → 2k tokens
├── Load AST metadata → 10k tokens
├── On demand: get_function("auth.ts", "login") → 200 tokens
├── Total: ~12k tokens → ✅ Fits in context
```

### Tool-Based Code Access

```
User: "How does user creation work?"

ipuaro:
1. [get_structure src/] → sees user/ folder
2. [get_function src/user/service.ts createUser] → gets function code
3. [find_references createUser] → finds all usages
4. Synthesizes answer with specific code context
```

## Contributing

Contributions welcome! This project is in early development.

```bash
# Clone
git clone https://github.com/samiyev/puaros.git
cd puaros/packages/ipuaro

# Install
pnpm install

# Build
pnpm build

# Test
pnpm test:run

# Coverage
pnpm test:coverage
```

## License

MIT © Fozilbek Samiyev

## Links

- [GitHub Repository](https://github.com/samiyev/puaros/tree/main/packages/ipuaro)
- [Issues](https://github.com/samiyev/puaros/issues)
- [Changelog](./CHANGELOG.md)
- [Roadmap](./ROADMAP.md)
