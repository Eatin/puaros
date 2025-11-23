# Guardian Roadmap 🗺️

This document outlines the current features and future plans for @puaros/guardian.

## Current Version: 0.1.0 ✅ RELEASED

**Released:** 2025-11-24

### Features Included in 0.1.0

**✨ Core Detection:**
- ✅ Hardcode detection (magic numbers, magic strings)
- ✅ Circular dependency detection
- ✅ Naming convention enforcement (layer-based rules)
- ✅ Architecture violations (Clean Architecture layers)

**🛠️ Developer Tools:**
- ✅ CLI interface with `guardian check` command
- ✅ Smart constant name suggestions
- ✅ Layer distribution analysis
- ✅ Detailed violation reports with file:line:column
- ✅ Context snippets for each issue

**📚 Documentation & Examples:**
- ✅ AI-focused documentation (vibe coding + enterprise)
- ✅ Comprehensive examples (36 files: 29 good + 7 bad patterns)
- ✅ DDD/Clean Architecture templates
- ✅ Quick start guides
- ✅ Integration examples (CI/CD, pre-commit hooks)

**🧪 Quality:**
- ✅ 159 tests across 6 test files (all passing)
- ✅ 80%+ code coverage on all metrics
- ✅ Self-analysis: 0 violations (100% clean codebase)
- ✅ Extracted constants for better maintainability

**🎯 Built For:**
- ✅ Vibe coders using AI assistants (Claude, GPT, Copilot, Cursor)
- ✅ Enterprise teams enforcing architectural standards
- ✅ Code review automation

---

## Future Roadmap

### Version 0.2.0 - Framework Leak Detection 🏗️
**Target:** Q4 2025 (December)
**Priority:** HIGH

Detect when domain layer imports framework-specific code:

```typescript
// ❌ Violation: Framework leak in domain
import { PrismaClient } from '@prisma/client'  // in domain layer
import { Request, Response } from 'express'    // in domain layer

// ✅ Good: Use interfaces
import { IUserRepository } from '../repositories'  // interface
```

**Planned Features:**
- Check domain layer imports for framework dependencies
- Blacklist common frameworks: prisma, typeorm, express, fastify, mongoose, etc.
- Suggest creating interfaces in domain with implementations in infrastructure
- CLI output with detailed suggestions
- New rule: `FRAMEWORK_LEAK` with severity levels

---

### Version 0.3.0 - Entity Exposure Detection 🎭
**Target:** Q1 2026
**Priority:** HIGH

Prevent domain entities from leaking to API responses:

```typescript
// ❌ Bad: Domain entity exposed!
async getUser(id: string): Promise<User> {
    return this.userService.findById(id)
}

// ✅ Good: Use DTOs and Mappers
async getUser(id: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(id)
    return UserMapper.toDto(user)
}
```

**Planned Features:**
- Analyze return types in controllers/routes
- Check if returned type is from domain/entities
- Suggest using DTOs and Mappers
- Examples of proper DTO usage

---

### Version 0.4.0 - Configuration File Support ⚙️
**Target:** Q1 2026
**Priority:** MEDIUM

Add support for configuration file `.guardianrc`:

```javascript
// guardian.config.js or .guardianrc.js
export default {
    rules: {
        'hardcode/magic-numbers': 'error',
        'hardcode/magic-strings': 'warn',
        'architecture/layer-violation': 'error',
        'architecture/framework-leak': 'error',
        'architecture/entity-exposure': 'error',
        'circular-dependency': 'error',
        'naming-convention': 'warn',
    },

    exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        'scripts/',
        'migrations/',
    ],

    layers: {
        domain: 'src/domain',
        application: 'src/application',
        infrastructure: 'src/infrastructure',
        shared: 'src/shared',
    },

    // Ignore specific violations
    ignore: {
        'hardcode/magic-numbers': {
            'config/constants.ts': [3000, 8080],  // Allow specific values
        },
    },
}
```

**Planned Features:**
- Configuration file support (.guardianrc, .guardianrc.js, guardian.config.js)
- Rule-level severity configuration (error, warn, off)
- Custom layer path mappings
- Per-file ignore patterns
- Extends support (base configs)

---

### Version 0.5.0 - Pattern Enforcement 🎯
**Target:** Q2 2026
**Priority:** MEDIUM

Enforce common DDD/Clean Architecture patterns:

**Repository Pattern:**
- Repository interfaces must be in domain
- Repository implementations must be in infrastructure
- No DB-specific code in interfaces

**Dependency Injection:**
- Detect `new ConcreteClass()` in use cases
- Enforce constructor injection
- Detect service locator anti-pattern

**Primitive Obsession:**
- Detect primitives where Value Objects should be used
- Common candidates: email, phone, money, percentage, URL
- Suggest creating Value Objects

**God Classes:**
- Classes with > N methods (configurable)
- Classes with > M lines (configurable)
- Suggest splitting into smaller classes

---

### Version 0.6.0 - Output Formats 📊
**Target:** Q2 2026
**Priority:** LOW

Multiple output format support for better integration:

```bash
# JSON for CI/CD integrations
guardian check ./src --format json

# HTML report for dashboards
guardian check ./src --format html --output report.html

# JUnit XML for CI systems
guardian check ./src --format junit

# SARIF for GitHub Code Scanning
guardian check ./src --format sarif

# Markdown for PR comments
guardian check ./src --format markdown
```

**Planned Features:**
- JSON output format
- HTML report generation
- JUnit XML format
- SARIF format (GitHub Code Scanning)
- Markdown format (for PR comments)
- Custom templates support

---

### Version 0.7.0 - Watch Mode & Git Integration 🔍
**Target:** Q3 2026
**Priority:** LOW

Real-time feedback and git integration:

```bash
# Watch mode - analyze on file changes
guardian watch ./src

# Only check changed files (git diff)
guardian check --git-diff

# Check files staged for commit
guardian check --staged

# Check files in PR
guardian check --pr
```

**Planned Features:**
- Watch mode for real-time analysis
- Git integration (check only changed files)
- Staged files checking
- PR file checking
- Pre-commit hook helper

---

### Version 0.8.0 - Auto-Fix Capabilities 🔧
**Target:** Q3 2026
**Priority:** LOW

Automatic refactoring and fixes:

```bash
# Interactive mode - choose fixes
guardian fix ./src --interactive

# Auto-fix all issues
guardian fix ./src --auto

# Dry run - show what would be fixed
guardian fix ./src --dry-run
```

**Planned Auto-fixes:**
1. Extract hardcoded values to constants
2. Create Value Objects from primitives
3. Generate repository interfaces
4. Create DTOs and mappers
5. Fix naming convention violations

---

### Version 1.0.0 - Stable Release 🚀
**Target:** Q4 2026
**Priority:** HIGH

Production-ready stable release:

**Features:**
- All detectors stabilized and tested
- Comprehensive documentation
- Performance optimizations
- Enterprise-grade reliability
- Breaking change stability commitment

**Ecosystem:**
- VS Code extension
- GitHub Action
- GitLab CI template
- Integration guides for major CI/CD platforms
- Metrics dashboard

---

## Future Ideas 💡

### AI Assistant Specific Features
- Detect over-engineering patterns (too many abstraction layers)
- Detect unimplemented code (TODO comments, placeholder methods)
- Naming consistency analysis (mixed conventions)
- Boundary validation detection

### Security Features
- Secrets detection (API keys, passwords, tokens)
- SQL injection pattern detection
- XSS vulnerability patterns
- Dependency vulnerability scanning

### Code Quality Metrics
- Code quality score (0-100)
- Maintainability index
- Technical debt estimation
- Trend analysis over time
- Compare metrics across commits

### Code Duplication
- Copy-paste detection
- Similar code block detection
- Suggest extracting common logic
- Duplicate constant detection

### IDE Extensions
- **VS Code Extension:**
  - Real-time detection as you type
  - Inline suggestions
  - Quick fixes
  - Code actions
  - Problem panel integration

- **JetBrains Plugin:**
  - IntelliJ IDEA, WebStorm support
  - Inspection integration
  - Quick fixes

### Platform Integrations
- **GitHub:**
  - GitHub Action
  - PR comments
  - Code scanning integration
  - Status checks
  - Trends dashboard

- **GitLab:**
  - GitLab CI template
  - Merge request comments
  - Security scanning integration

- **Bitbucket:**
  - Pipelines integration
  - PR decorators

---

## How to Contribute

Have an idea? Want to implement a feature?

1. Check existing [GitHub Issues](https://github.com/samiyev/puaros/issues)
2. Create a new issue with label `enhancement`
3. Discuss the approach with maintainers
4. Submit a Pull Request

We welcome contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

---

## Versioning

Guardian follows [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0) - Breaking changes
- **MINOR** (0.1.0) - New features, backwards compatible
- **PATCH** (0.0.1) - Bug fixes, backwards compatible

Until we reach 1.0.0, minor version bumps (0.x.0) may include breaking changes as we iterate on the API.

---

**Last Updated:** 2025-11-24
**Current Version:** 0.1.0
