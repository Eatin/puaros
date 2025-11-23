# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Puaros is a TypeScript monorepo using pnpm workspaces. Currently contains the `@puaros/guardian` package - a code quality guardian for detecting hardcoded values, circular dependencies, and architecture violations. The project uses Node.js 22.18.0 (see `.nvmrc`).

## Essential Commands

### Build & Development

```bash
# Build all packages
pnpm build:all

# Clean all builds
pnpm clean:all

# Build specific package
cd packages/guardian && pnpm build

# Watch mode for specific package
cd packages/guardian && pnpm watch
```

### Testing

```bash
# Run all tests across packages
pnpm test

# Guardian package testing options
cd packages/guardian
pnpm test              # Run tests in watch mode
pnpm test:run          # Run tests once
pnpm test:coverage     # Generate coverage report (80% threshold)
pnpm test:ui           # Open Vitest UI
pnpm test:watch        # Explicit watch mode
```

Tests use Vitest with coverage thresholds set to 80% for lines, functions, branches, and statements.

### Linting & Formatting

```bash
# Format all TypeScript files
pnpm format

# Lint and auto-fix all TypeScript files
pnpm lint

# Check linting without fixing
pnpm eslint "packages/**/*.ts"
```

## Code Style Requirements

**Critical: This project uses 4-space indentation, not 2 spaces.**

### Key Configuration
- **Indentation:** 4 spaces (enforced by Prettier)
- **Line Length:** 100 characters max
- **Quotes:** Double quotes
- **Semicolons:** Never used
- **Trailing Commas:** Always in multiline
- **TypeScript:** Strict type checking with nodenext modules

### TypeScript Rules to Follow

From `eslint.config.mjs` and detailed in `LINTING.md`:

1. **Type Safety (warnings, must address):**
   - Avoid `any` type - use proper typing
   - Declare explicit function return types
   - No floating promises (always await or handle)
   - No unsafe type operations

2. **Code Quality (errors, must fix):**
   - Use `const` for non-reassigned variables
   - Always use `===` instead of `==`
   - Always use curly braces for conditionals/loops
   - Handle all promises (no floating promises)
   - No `console.log` (use `console.warn`/`console.error` or proper logger)

3. **Complexity Limits (warnings):**
   - Max cyclomatic complexity: 15
   - Max function parameters: 5
   - Max lines per function: 100
   - Max nesting depth: 4

4. **Comments Style:**
   - Single-line comments must have a space after `//` (e.g., `// Comment`)
   - Multi-line comments should use JSDoc style (`/** */`)
   - No section divider comments (e.g., `// Entities`, `// Value Objects`) in code
   - Comments should explain "why", not "what" (code should be self-documenting)
   - TODO/FIXME/HACK comments trigger warnings

## Git Commit Format

Follow Conventional Commits format. See `.gitmessage` for full rules.

Format: `<type>: <subject>` (imperative mood, no caps, max 50 chars)

**IMPORTANT: Do NOT add "Generated with Claude Code" footer or "Co-Authored-By: Claude" to commit messages.**
Commits should only follow the Conventional Commits format without any additional attribution.

## Monorepo Structure

```
puaros/
├── packages/
│   └── guardian/                # @puaros/guardian - Code quality analyzer
│       ├── src/                 # Source files (Clean Architecture layers)
│       │   ├── domain/          # Domain layer (entities, value objects)
│       │   ├── application/     # Application layer (use cases, DTOs)
│       │   ├── infrastructure/  # Infrastructure layer (parsers, analyzers)
│       │   ├── cli/            # CLI implementation
│       │   └── shared/          # Shared utilities
│       ├── dist/                # Build output
│       ├── bin/                 # CLI entry point
│       ├── tests/               # Test files
│       ├── examples/            # Usage examples
│       └── package.json         # Uses Vitest for testing
├── pnpm-workspace.yaml          # Workspace configuration
└── tsconfig.base.json           # Shared TypeScript config
```

### Guardian Package Architecture

The guardian package follows Clean Architecture principles:
- **Domain Layer**: Core business logic (entities, value objects, domain events)
- **Application Layer**: Use cases, DTOs, and mappers
- **Infrastructure Layer**: External concerns (parsers, analyzers, file scanners)
- **CLI Layer**: Command-line interface implementation

Key features:
- Hardcode detection (magic numbers, strings)
- Circular dependency detection
- Naming convention validation
- CLI tool with `guardian` command

### TypeScript Configuration

Base configuration (`tsconfig.base.json`) uses:
- Module: `nodenext` with `nodenext` resolution
- Target: `ES2023`
- Strict null checks enabled
- Decorators enabled (experimental)
- JSX configured for React

Guardian package (`packages/guardian/tsconfig.json`):
- Module: `CommonJS`
- Module Resolution: `node`
- Target: `ES2023`
- Output to `dist/` from `src/`
- Strict type checking enabled

**Important:** The guardian package uses CommonJS output for compatibility.

## Adding New Packages

1. Create `packages/new-package/` directory
2. Add `package.json` with name `@puaros/new-package`
3. Create `tsconfig.json` extending `../../tsconfig.base.json`
4. Package auto-discovered via `pnpm-workspace.yaml` glob pattern

## Dependencies

Guardian package uses:
- `commander` - CLI framework for command-line interface
- `simple-git` - Git operations
- `tree-sitter` - Abstract syntax tree parsing
- `tree-sitter-javascript` - JavaScript parser
- `tree-sitter-typescript` - TypeScript parser
- `uuid` - UUID generation

Development tools:
- Vitest for testing with coverage thresholds
- ESLint with TypeScript strict rules
- Prettier for formatting
- `@vitest/ui` - Vitest UI for interactive testing
- `@vitest/coverage-v8` - Coverage reporting

## Important Notes

- **Always run `pnpm format` before committing** to ensure 4-space indentation
- **Fix ESLint warnings incrementally** - they indicate real type safety issues
- **Coverage is enforced** - maintain 80% coverage for all metrics when running `pnpm test:coverage`