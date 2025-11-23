# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Puaros is a TypeScript monorepo using pnpm workspaces. Currently contains the `@puaros/core` package for core business logic. The project uses Node.js 22.18.0 (see `.nvmrc`).

## Essential Commands

### Build & Development

```bash
# Build all packages
pnpm build:all

# Clean all builds
pnpm clean:all

# Build specific package
cd packages/core && pnpm build

# Watch mode for specific package
cd packages/core && pnpm watch
```

### Testing

```bash
# Run all tests across packages
pnpm test

# Core package testing options
cd packages/core
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
- **Quotes:** Single quotes
- **Semicolons:** Always required
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

## Git Commit Format

Follow Conventional Commits format. See `.gitmessage` for full rules.

Format: `<type>: <subject>` (imperative mood, no caps, max 50 chars)

**IMPORTANT: Do NOT add "Generated with Claude Code" footer or "Co-Authored-By: Claude" to commit messages.**
Commits should only follow the Conventional Commits format without any additional attribution.

## Monorepo Structure

```
puaros/
├── packages/
│   └── core/              # @puaros/core - Core business logic
│       ├── src/           # Source files
│       ├── dist/          # Build output
│       └── package.json   # Uses Vitest for testing
├── pnpm-workspace.yaml    # Workspace configuration
└── tsconfig.base.json     # Shared TypeScript config
```

### TypeScript Configuration

Base configuration (`tsconfig.base.json`) uses:
- Module: `nodenext` with `nodenext` resolution
- Target: `ES2023`
- Strict null checks enabled
- Decorators enabled (experimental)
- JSX configured for React

Core package (`packages/core/tsconfig.json`) overrides:
- Module: `CommonJS` (not nodenext)
- Module Resolution: `node` (not nodenext)
- Output to `dist/` from `src/`

**Important:** The core package uses CommonJS output despite base config using nodenext.

## Adding New Packages

1. Create `packages/new-package/` directory
2. Add `package.json` with name `@puaros/new-package`
3. Create `tsconfig.json` extending `../../tsconfig.base.json`
4. Package auto-discovered via `pnpm-workspace.yaml` glob pattern

## Dependencies

Core package uses:
- `simple-git` - Git operations
- `tree-sitter-*` - Code parsing (JavaScript/TypeScript)
- `uuid` - UUID generation

Development tools:
- Vitest for testing (replaces Jest)
- ESLint with TypeScript strict rules
- Prettier for formatting

## Important Notes

- **Always run `pnpm format` before committing** to ensure 4-space indentation
- **Fix ESLint warnings incrementally** - they indicate real type safety issues
- **Coverage is enforced** - maintain 80% coverage for all metrics when running `pnpm test:coverage`