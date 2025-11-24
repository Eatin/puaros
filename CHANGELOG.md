# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2025-11-24

### Added
- Dependency direction enforcement - validate that dependencies flow in the correct direction according to Clean Architecture principles
- Architecture layer violation detection for domain, application, and infrastructure layers

## [0.3.0] - 2025-11-24

### Added
- Entity exposure detection - identify when domain entities are exposed outside their module boundaries
- Enhanced architecture violation reporting

## [0.2.0] - 2025-11-24

### Added
- Framework leak detection - detect when domain layer imports framework code
- Framework leak reporting in CLI
- Framework leak examples and documentation

## [0.1.0] - 2025-11-24

### Added
- Initial monorepo setup with pnpm workspaces
- `@puaros/guardian` package - code quality guardian for vibe coders and enterprise teams
- TypeScript with strict type checking and Vitest configuration
- ESLint strict TypeScript rules with 4-space indentation
- Prettier code formatting (4 spaces, double quotes, no semicolons)
- LINTING.md documentation for code style guidelines
- CLAUDE.md for AI assistant guidance
- EditorConfig for consistent IDE settings
- Node.js version specification (.nvmrc: 22.18.0)
- Vitest testing framework with 80% coverage thresholds
- Guardian dependencies: commander, simple-git, tree-sitter, uuid

### Configuration
- TypeScript: nodenext modules, ES2023 target, strict null checks
- ESLint: Strict type checking, complexity limits, code quality rules
- Prettier: 100 char line length, double quotes, no semicolons, trailing commas
- Test coverage: 80% threshold for lines, functions, branches, statements

### Guardian Package
- Hardcode detection (magic numbers, strings)
- Circular dependency detection
- Naming convention enforcement
- Architecture violation detection
- CLI tool with `guardian` command
- 159 tests, all passing
- Clean Architecture implementation

## [0.0.1] - 2025-11-24

### Added
- Initial project structure
- Monorepo workspace configuration