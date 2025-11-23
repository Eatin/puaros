# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial monorepo setup with pnpm workspaces
- `@puaros/core` package with TypeScript and Vitest configuration
- ESLint strict TypeScript rules with 4-space indentation
- Prettier code formatting (4 spaces, single quotes)
- LINTING.md documentation for code style guidelines
- CLAUDE.md for AI assistant guidance
- EditorConfig for consistent IDE settings
- Node.js version specification (.nvmrc: 22.18.0)
- Vitest testing framework with 80% coverage thresholds
- Core dependencies: simple-git, tree-sitter (JavaScript/TypeScript), uuid

### Configuration
- TypeScript: nodenext modules, ES2023 target, strict null checks
- ESLint: Strict type checking, complexity limits, code quality rules
- Prettier: 100 char line length, single quotes, trailing commas
- Test coverage: 80% threshold for lines, functions, branches, statements

## [0.0.1] - 2025-01-23

### Added
- Initial project structure
- Monorepo workspace configuration