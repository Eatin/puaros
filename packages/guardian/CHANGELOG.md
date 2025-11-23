# Changelog

All notable changes to @puaros/guardian will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-24

### Added

**🎉 Initial Release of @puaros/guardian**

Code quality guardian for vibe coders and enterprise teams - your AI coding companion that keeps code clean while you move fast.

#### Core Features

- ✨ **Hardcode Detection**
  - Detects magic numbers (timeouts, ports, limits, retries, delays)
  - Detects magic strings (URLs, connection strings, API endpoints, error messages)
  - Smart context analysis to reduce false positives
  - Automatic constant name suggestions based on context
  - Location suggestions for extracted constants (domain/shared/infrastructure)
  - Ignores allowed numbers: -1, 0, 1, 2, 10, 100, 1000
  - Ignores console.log, imports, tests, and exported constants

- 🔄 **Circular Dependency Detection**
  - Detects import cycles in codebase (A → B → A, A → B → C → A, etc.)
  - Shows complete dependency chain for each cycle
  - CLI output with detailed cycle path and severity
  - Supports detection of multiple independent cycles
  - Handles complex graphs with both cyclic and acyclic parts

- 📝 **Naming Convention Enforcement**
  - Layer-based naming rules for Clean Architecture
  - **Domain Layer:**
    - Entities: PascalCase nouns (User.ts, Order.ts)
    - Services: *Service suffix (UserService.ts)
    - Repository interfaces: I*Repository prefix (IUserRepository.ts)
    - Forbidden patterns: Dto, Controller, Request, Response
  - **Application Layer:**
    - Use cases: Verb + Noun in PascalCase (CreateUser.ts, UpdateProfile.ts)
    - DTOs: *Dto, *Request, *Response suffixes
    - Mappers: *Mapper suffix
  - **Infrastructure Layer:**
    - Controllers: *Controller suffix
    - Repository implementations: *Repository suffix
    - Services: *Service or *Adapter suffixes
  - Smart exclusion system for base classes
  - Support for 26 standard use case verbs

- 🏗️ **Architecture Violations**
  - Clean Architecture layer validation
  - Dependency rules enforcement:
    - Domain → can only import Shared
    - Application → can import Domain, Shared
    - Infrastructure → can import Domain, Application, Shared
    - Shared → cannot import anything
  - Layer detection from file paths
  - Import statement analysis

#### CLI Interface

- 🛠️ **Command-line tool** (`guardian` command)
  - `guardian check <path>` - analyze project
  - `--exclude <dirs>` - exclude directories
  - `--verbose` - detailed output
  - `--no-hardcode` - skip hardcode detection
  - `--no-architecture` - skip architecture checks
  - `--version` - show version
  - `--help` - show help

#### Reporting & Metrics

- 📊 **Comprehensive metrics**
  - Total files analyzed
  - Total functions count
  - Total imports count
  - Layer distribution statistics (domain/application/infrastructure/shared)
  - Detailed violation reports with file:line:column
  - Context snippets for each violation
  - Smart suggestions for fixing issues

#### Developer Experience

- 🤖 **Built for AI-Assisted Development**
  - Perfect companion for Claude, GPT, Copilot, Cursor
  - Catches common AI code smells (hardcoded values, architecture violations)
  - Educational error messages with fix suggestions
  - Designed for vibe coding workflow: AI writes → Guardian reviews → AI fixes → Ship

- 🏢 **Enterprise-Ready**
  - Enforce architectural standards at scale
  - CI/CD integration ready
  - JSON/Markdown output for automation
  - Security: catch hardcoded secrets before production
  - Metrics export for dashboards

#### Examples & Documentation

- 📚 **Comprehensive examples** (36 files)
  - **Good Architecture** (29 files): Complete DDD/Clean Architecture patterns
    - Domain: Aggregates, Entities, Value Objects, Events, Services, Factories, Specifications
    - Application: Use Cases, DTOs, Mappers
    - Infrastructure: Repositories, Controllers
  - **Bad Architecture** (7 files): Anti-patterns to avoid
    - Hardcoded values, Circular dependencies, Framework leaks, Entity exposure, Naming violations
  - All examples fully documented with explanations
  - Can be used as templates for new projects

#### Testing & Quality

- ✅ **Comprehensive test suite**
  - 159 tests across 6 test files
  - All tests passing
  - 80%+ code coverage on all metrics
  - Test fixtures for various scenarios
  - Integration and unit tests

- 🧹 **Self-analyzing**
  - Guardian passes its own checks with **0 violations**
  - All constants extracted (no hardcoded values)
  - Follows Clean Architecture
  - No circular dependencies
  - Proper naming conventions

#### Technical Details

**Architecture:**
- Built with Clean Architecture principles
- Domain-Driven Design (DDD) patterns
- Layered architecture (Domain, Application, Infrastructure, Shared)
- TypeScript with strict type checking
- Tree-sitter based AST parsing

**Dependencies:**
- commander ^12.1.0 - CLI framework
- simple-git ^3.30.0 - Git operations
- tree-sitter ^0.21.1 - Abstract syntax tree parsing
- tree-sitter-javascript ^0.23.0 - JavaScript parser
- tree-sitter-typescript ^0.23.0 - TypeScript parser
- uuid ^13.0.0 - UUID generation

**Development:**
- TypeScript 5.7.3
- Vitest 4.0.10 for testing
- Node.js >= 18.0.0 required
- CommonJS output with full TypeScript declarations
- Source maps included

**Package:**
- Size: ~58 KB compressed
- Unpacked: ~239 KB
- 172 files included
- Public npm package (`@puaros/guardian`)
- CLI binary: `guardian`

### Documentation

- 📖 **Comprehensive README** (25KB+)
  - Quick start for vibe coders (30-second setup)
  - Enterprise integration guides (CI/CD, pre-commit, metrics)
  - Real-world examples and workflows
  - API documentation
  - FAQ for both vibe coders and enterprise teams
  - Success stories and use cases

- 🗺️ **Roadmap** - Future features and improvements
- 📋 **Contributing guidelines**
- 📝 **TODO list** - Technical debt tracking
- 📄 **MIT License**

### Notes

- First public release on npm
- Production-ready for both individual developers and enterprise teams
- Perfect for AI-assisted development workflows
- Enforces Clean Architecture at scale
- Zero violations in own codebase (self-tested)

---

## Future Releases

Planned features for upcoming versions:
- Framework leaks detection (domain importing from infrastructure)
- Entity exposure detection (domain entities in presentation layer)
- Configuration file support (.guardianrc)
- Custom rule definitions
- Plugin system
- Multi-language support
- Watch mode
- Auto-fix capabilities
- Git integration (check only changed files)
- Performance optimizations

See [ROADMAP.md](./ROADMAP.md) for detailed feature roadmap.

---

## Version Guidelines

### Semantic Versioning

**MAJOR.MINOR.PATCH** (e.g., 1.2.3)

- **MAJOR** - Incompatible API changes
- **MINOR** - New features, backwards compatible
- **PATCH** - Bug fixes, backwards compatible

### Release Checklist

Before releasing a new version:
- [ ] Update CHANGELOG.md with all changes
- [ ] Update version in package.json
- [ ] Run `pnpm test` - all tests pass
- [ ] Run `pnpm build` - clean build
- [ ] Run `pnpm test:coverage` - coverage >= 80%
- [ ] Update ROADMAP.md if needed
- [ ] Update README.md if API changed
- [ ] Create git tag: `git tag v0.1.0`
- [ ] Push to GitHub: `git push origin main --tags`
- [ ] Publish to npm: `npm publish`

---

**Links:**
- [Official Website](https://puaros.ailabs.uz)
- [GitHub Repository](https://github.com/samiyev/puaros)
- [npm Package](https://www.npmjs.com/package/@puaros/guardian)
- [Documentation](https://github.com/samiyev/puaros/packages/guardian#readme)
- [Roadmap](./ROADMAP.md)
- [Issues](https://github.com/samiyev/puaros/issues)
