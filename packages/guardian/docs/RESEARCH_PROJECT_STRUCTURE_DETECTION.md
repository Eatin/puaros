# Research: Project Structure Detection for Architecture Analysis

This document provides comprehensive research on approaches to detecting and validating project architecture structure. It covers existing tools, academic research, algorithms, and industry best practices that inform Guardian's architecture detection strategy.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Existing Tools Analysis](#2-existing-tools-analysis)
3. [Academic Approaches to Architecture Recovery](#3-academic-approaches-to-architecture-recovery)
4. [Graph Analysis Algorithms](#4-graph-analysis-algorithms)
5. [Configuration Patterns and Best Practices](#5-configuration-patterns-and-best-practices)
6. [Industry Consensus](#6-industry-consensus)
7. [Recommendations for Guardian](#7-recommendations-for-guardian)
8. [Additional Resources](#8-additional-resources)

---

## 1. Executive Summary

### Key Finding

**Industry consensus:** Automatic architecture detection is unreliable. All major tools (ArchUnit, eslint-plugin-boundaries, Nx, dependency-cruiser, SonarQube) require **explicit configuration** from users rather than attempting automatic detection.

### Why Automatic Detection Fails

1. **Too Many Variations**: Project structures vary wildly across teams, frameworks, and domains
2. **False Positives**: Algorithms may "detect" non-existent architectural patterns
3. **Performance**: Graph analysis is slow for large codebases (>2000 files)
4. **Ambiguity**: Same folder names can mean different things in different contexts
5. **Legacy Code**: Poorly structured code produces meaningless analysis results

### Recommended Approach

| Priority | Approach | Description |
|----------|----------|-------------|
| P0 | Pattern-based detection | Glob/regex patterns for layer identification |
| P0 | Configuration file | `.guardianrc.json` for explicit rules |
| P1 | Presets | Pre-configured patterns for common architectures |
| P1 | Generic mode | Fallback with minimal checks |
| P2 | Interactive setup | CLI wizard for configuration generation |
| P2 | Graph visualization | Visual dependency analysis (informational only) |
| ❌ | Auto-detection | NOT recommended as primary strategy |

---

## 2. Existing Tools Analysis

### 2.1 ArchUnit (Java)

**Approach:** Fully declarative - user defines all layers explicitly.

**Official Website:** https://www.archunit.org/

**User Guide:** https://www.archunit.org/userguide/html/000_Index.html

**GitHub Repository:** https://github.com/TNG/ArchUnit

**Key Characteristics:**
- Does NOT detect architecture automatically
- User explicitly defines layers via package patterns
- Fluent API for rule definition
- Supports Layered, Onion, and Hexagonal architectures out-of-box
- Integrates with JUnit/TestNG test frameworks

**Example Configuration:**
```java
layeredArchitecture()
    .layer("Controller").definedBy("..controller..")
    .layer("Service").definedBy("..service..")
    .layer("Persistence").definedBy("..persistence..")
    .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
    .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller")
    .whereLayer("Persistence").mayOnlyBeAccessedByLayers("Service")
```

**References:**
- Baeldung Tutorial: https://www.baeldung.com/java-archunit-intro
- InfoQ Article: https://www.infoq.com/news/2022/10/archunit/
- Examples Repository: https://github.com/TNG/ArchUnit-Examples

---

### 2.2 eslint-plugin-boundaries (TypeScript/JavaScript)

**Approach:** Pattern-based element definition with dependency rules.

**NPM Package:** https://www.npmjs.com/package/eslint-plugin-boundaries

**GitHub Repository:** https://github.com/javierbrea/eslint-plugin-boundaries

**Key Characteristics:**
- Does NOT detect architecture automatically
- Uses micromatch/glob patterns for element identification
- Supports capture groups for dynamic element naming
- TypeScript import type awareness (`value` vs `type` imports)
- Works with monorepos

**Example Configuration:**
```javascript
settings: {
    "boundaries/elements": [
        {
            type: "domain",
            pattern: "src/domain/*",
            mode: "folder",
            capture: ["elementName"]
        },
        {
            type: "application",
            pattern: "src/application/*",
            mode: "folder"
        },
        {
            type: "infrastructure",
            pattern: "src/infrastructure/*",
            mode: "folder"
        }
    ]
},
rules: {
    "boundaries/element-types": [2, {
        default: "disallow",
        rules: [
            { from: "infrastructure", allow: ["application", "domain"] },
            { from: "application", allow: ["domain"] },
            { from: "domain", disallow: ["*"] }
        ]
    }]
}
```

**References:**
- TypeScript Example: https://github.com/javierbrea/epb-ts-example
- Element Types Documentation: https://github.com/javierbrea/eslint-plugin-boundaries/blob/master/docs/rules/element-types.md
- Medium Tutorial: https://medium.com/@taynan_duarte/ensuring-dependency-rules-in-a-nodejs-application-with-typescript-using-eslint-plugin-boundaries-68b70ce32437

---

### 2.3 SonarQube Architecture as Code

**Approach:** YAML/JSON configuration with automatic code structure analysis.

**Official Documentation:** https://docs.sonarsource.com/sonarqube-server/design-and-architecture/overview/

**Configuration Guide:** https://docs.sonarsource.com/sonarqube-server/design-and-architecture/configuring-the-architecture-analysis/

**Key Characteristics:**
- Introduced in SonarQube 2025 Release 2
- Automatic code structure analysis (basic)
- YAML/JSON configuration for custom rules
- Supports "Perspectives" (multiple views of architecture)
- Hierarchical "Groups" for organization
- Glob and regex pattern support
- Works without configuration for basic checks (cycle detection)

**Supported Languages:**
- Java (SonarQube Server)
- Java, JavaScript, TypeScript (SonarQube Cloud)
- Python, C# (coming soon)
- C++ (under consideration)

**Example Configuration:**
```yaml
# architecture.yaml
perspectives:
  - name: "Clean Architecture"
    groups:
      - name: "Domain"
        patterns:
          - "src/domain/**"
          - "src/core/**"
      - name: "Application"
        patterns:
          - "src/application/**"
          - "src/use-cases/**"
      - name: "Infrastructure"
        patterns:
          - "src/infrastructure/**"
          - "src/adapters/**"
    constraints:
      - from: "Domain"
        deny: ["Application", "Infrastructure"]
      - from: "Application"
        deny: ["Infrastructure"]
```

**References:**
- Blog Announcement: https://www.sonarsource.com/blog/introducing-architecture-as-code-in-sonarqube/
- Security Boulevard Coverage: https://securityboulevard.com/2025/04/introducing-architecture-as-code-in-sonarqube-7/

---

### 2.4 Nx Enforce Module Boundaries

**Approach:** Tag-based system with ESLint integration.

**Official Documentation:** https://nx.dev/docs/features/enforce-module-boundaries

**ESLint Rule Guide:** https://nx.dev/docs/technologies/eslint/eslint-plugin/guides/enforce-module-boundaries

**Key Characteristics:**
- Tag-based constraint system (scope, type)
- Projects tagged in project.json or package.json
- Supports regex patterns in tags
- Two-dimensional constraints (scope + type)
- External dependency blocking
- Integration with Nx project graph

**Example Configuration:**
```json
// project.json
{
    "name": "user-domain",
    "tags": ["scope:user", "type:domain"]
}

// ESLint config
{
    "@nx/enforce-module-boundaries": ["error", {
        "depConstraints": [
            {
                "sourceTag": "type:domain",
                "onlyDependOnLibsWithTags": ["type:domain"]
            },
            {
                "sourceTag": "type:application",
                "onlyDependOnLibsWithTags": ["type:domain", "type:application"]
            },
            {
                "sourceTag": "scope:user",
                "onlyDependOnLibsWithTags": ["scope:user", "scope:shared"]
            }
        ]
    }]
}
```

**References:**
- Project Dependency Rules: https://nx.dev/docs/concepts/decisions/project-dependency-rules
- Blog Post on Module Boundaries: https://nx.dev/blog/mastering-the-project-boundaries-in-nx
- Medium Tutorial: https://medium.com/rupesh-tiwari/enforcing-dependency-constraints-within-service-in-nx-monorepo-workspace-56e87e792c98

---

### 2.5 dependency-cruiser

**Approach:** Rule-based validation with visualization capabilities.

**NPM Package:** https://www.npmjs.com/package/dependency-cruiser

**GitHub Repository:** https://github.com/sverweij/dependency-cruiser

**Key Characteristics:**
- Regex patterns for from/to rules
- Multiple output formats (SVG, DOT, Mermaid, JSON, HTML)
- CI/CD integration support
- TypeScript pre-compilation dependency support
- Does NOT detect architecture automatically

**Example Configuration:**
```javascript
// .dependency-cruiser.js
module.exports = {
    forbidden: [
        {
            name: "no-domain-to-infrastructure",
            severity: "error",
            from: { path: "^src/domain" },
            to: { path: "^src/infrastructure" }
        },
        {
            name: "no-circular",
            severity: "error",
            from: {},
            to: { circular: true }
        }
    ],
    options: {
        doNotFollow: { path: "node_modules" },
        tsPreCompilationDeps: true
    }
}
```

**References:**
- Options Reference: https://github.com/sverweij/dependency-cruiser/blob/main/doc/options-reference.md
- Rules Reference: https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md
- Clean Architecture Tutorial: https://betterprogramming.pub/validate-dependencies-according-to-clean-architecture-743077ea084c

---

### 2.6 ts-arch / ArchUnitTS (TypeScript)

**Approach:** ArchUnit-like fluent API for TypeScript.

**ts-arch GitHub:** https://github.com/ts-arch/ts-arch

**ts-arch Documentation:** https://ts-arch.github.io/ts-arch/

**ArchUnitTS GitHub:** https://github.com/LukasNiessen/ArchUnitTS

**Key Characteristics:**
- Fluent API similar to ArchUnit
- PlantUML diagram validation support
- Jest/Vitest integration
- Nx monorepo support
- Does NOT detect architecture automatically

**Example Usage:**
```typescript
import { filesOfProject } from "tsarch"

// Folder-based dependency check
const rule = filesOfProject()
    .inFolder("domain")
    .shouldNot()
    .dependOnFiles()
    .inFolder("infrastructure")

await expect(rule).toPassAsync()

// PlantUML diagram validation
const rule = await slicesOfProject()
    .definedBy("src/(**/)")
    .should()
    .adhereToDiagramInFile("architecture.puml")
```

**References:**
- NPM Package: https://www.npmjs.com/package/tsarch
- ArchUnitTS Documentation: https://lukasniessen.github.io/ArchUnitTS/
- DeepWiki Analysis: https://deepwiki.com/ts-arch/ts-arch

---

### 2.7 Madge

**Approach:** Visualization and circular dependency detection.

**NPM Package:** https://www.npmjs.com/package/madge

**GitHub Repository:** https://github.com/pahen/madge

**Key Characteristics:**
- Dependency graph visualization
- Circular dependency detection
- Multiple layout algorithms (dot, neato, fdp, circo)
- Simple CLI interface
- Does NOT define or enforce layers

**Usage:**
```bash
# Find circular dependencies
npx madge --circular src/

# Generate dependency graph
npx madge src/ --image deps.svg

# TypeScript support
npx madge src/main.ts --ts-config tsconfig.json --image ./deps.png
```

**References:**
- NestJS Integration: https://manishbit97.medium.com/identifying-circular-dependencies-in-nestjs-using-madge-de137cd7f74f
- Angular Integration: https://www.angulartraining.com/daily-newsletter/visualizing-internal-dependencies-with-madge/
- React/TypeScript Tutorial: https://dev.to/greenroach/detecting-circular-dependencies-in-a-reacttypescript-app-using-madge-229

**Alternative: Skott**
- Claims to be 7x faster than Madge
- Reference: https://dev.to/antoinecoulon/introducing-skott-the-new-madge-1bfl

---

## 3. Academic Approaches to Architecture Recovery

### 3.1 Software Architecture Recovery Overview

**Wikipedia Definition:** https://en.wikipedia.org/wiki/Software_architecture_recovery

Software architecture recovery is a set of methods for extracting architectural information from lower-level representations of a software system, such as source code. The abstraction process frequently involves clustering source code entities (files, classes, functions) into subsystems according to application-dependent or independent criteria.

**Motivation:**
- Legacy systems often lack architectural documentation
- Existing documentation is frequently out of sync with implementation
- Understanding architecture is essential for maintenance and evolution

---

### 3.2 Machine Learning Approaches

**Research Paper:** "Automatic software architecture recovery: A machine learning approach"

**Source:** ResearchGate - https://www.researchgate.net/publication/261309157_Automatic_software_architecture_recovery_A_machine_learning_approach

**Key Points:**
- Current architecture recovery techniques require heavy human intervention or fail to recover quality components
- Machine learning techniques use multiple feature types:
  - Structural features (dependencies, coupling)
  - Runtime behavioral features
  - Domain/textual features
  - Contextual features (code authorship, line co-change)
- Automatically recovering functional architecture facilitates developer understanding

**Limitation:** Requires training data and may not generalize across project types.

---

### 3.3 Genetic Algorithms for Architecture Recovery

**Research Paper:** "Parallelization of genetic algorithms for software architecture recovery"

**Source:** Springer - https://link.springer.com/content/pdf/10.1007/s10515-024-00479-0.pdf

**Key Points:**
- Software Architecture Recovery (SAR) techniques analyze dependencies between modules
- Automatically cluster modules to achieve high modularity
- Many approaches employ Genetic Algorithms (GAs)
- Major drawback: lack of scalability
- Solution: parallel execution of GA subroutines

**Finding:** Finding optimal software clustering is an NP-complete problem.

---

### 3.4 Clustering Algorithms Comparison

**Research Paper:** "A comparative analysis of software architecture recovery techniques"

**Source:** IEEE Xplore - https://ieeexplore.ieee.org/document/6693106/

**Algorithms Compared:**
| Algorithm | Description | Strengths | Weaknesses |
|-----------|-------------|-----------|------------|
| ACDC | Comprehension-Driven Clustering | Finds natural subsystems | Requires parameter tuning |
| LIMBO | Information-Theoretic Clustering | Scalable | May miss domain patterns |
| WCA | Weighted Combined Algorithm | Balances multiple factors | Complex configuration |
| K-means | Baseline clustering | Simple, fast | Poor for code structure |

**Key Finding:** Even the best techniques have surprisingly low accuracy when compared against verified ground truths.

---

### 3.5 ACDC Algorithm (Algorithm for Comprehension-Driven Clustering)

**Original Paper:** "ACDC: An Algorithm for Comprehension-Driven Clustering"

**Source:** ResearchGate - https://www.researchgate.net/publication/221200422_ACDC_An_Algorithm_for_Comprehension-Driven_Clustering

**York University Wiki:** https://wiki.eecs.yorku.ca/project/cluster/protected:acdc

**Algorithm Steps:**
1. Build dependency graph
2. Find "dominator" nodes (subsystem patterns)
3. Group nodes with common dominators
4. Apply orphan adoption for ungrouped nodes
5. Iteratively improve clusters

**Advantages:**
- Considers human comprehension patterns
- Finds natural subsystems
- Works without prior knowledge

**Disadvantages:**
- Requires parameter tuning
- Does not guarantee optimality
- May not work well on poorly structured code

---

### 3.6 LLM-Based Architecture Recovery (Recent Research)

**Research Paper:** "Automated Software Architecture Design Recovery from Source Code Using LLMs"

**Source:** Springer - https://link.springer.com/chapter/10.1007/978-3-032-02138-0_5

**Key Findings:**
- LLMs show promise for automating software architecture recovery
- Effective at identifying:
  - ✅ Architectural styles
  - ✅ Structural elements
  - ✅ Basic design patterns
- Struggle with:
  - ❌ Complex abstractions
  - ❌ Class relationships
  - ❌ Fine-grained design patterns

**Conclusion:** "LLMs can support SAR activities, particularly in identifying structural and stylistic elements, but they struggle with complex abstractions"

**Additional Reference:** arXiv paper on design principles - https://arxiv.org/html/2508.11717

---

## 4. Graph Analysis Algorithms

### 4.1 Louvain Algorithm for Community Detection

**Wikipedia:** https://en.wikipedia.org/wiki/Louvain_method

**Original Paper:** "Fast unfolding of communities in large networks" (2008)
- Authors: Vincent D Blondel, Jean-Loup Guillaume, Renaud Lambiotte, Etienne Lefebvre
- Journal: Journal of Statistical Mechanics: Theory and Experiment
- Reference: https://perso.uclouvain.be/vincent.blondel/research/louvain.html

**Algorithm Description:**
1. Initialize each node as its own community
2. For each node, try moving to neighboring communities
3. Select move with maximum modularity gain
4. Merge communities into "super-nodes"
5. Repeat from step 2

**Modularity Formula:**
```
Q = (1/2m) * Σ[Aij - (ki*kj)/(2m)] * δ(ci, cj)

Where:
- Aij = edge weight between i and j
- ki, kj = node degrees
- m = sum of all weights
- δ = 1 if ci = cj (same cluster)
```

**Characteristics:**
| Parameter | Value |
|-----------|-------|
| Time Complexity | O(n log n) |
| Modularity Range | -1 to 1 |
| Good Result | Q > 0.3 |
| Resolution Limit | Yes (may hide small communities) |

**Implementations:**
- NetworkX: https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.community.louvain.louvain_communities.html
- Neo4j: https://neo4j.com/docs/graph-data-science/current/algorithms/louvain/
- Graphology: https://graphology.github.io/standard-library/communities-louvain.html
- igraph: https://igraph.org/r/doc/cluster_louvain.html

**Application to Code Analysis:**
```
Dependency Graph:
User.ts → Email.ts, UserId.ts
Order.ts → OrderId.ts, Money.ts
UserController.ts → User.ts, CreateUser.ts

Louvain detects communities:
Community 1: [User.ts, Email.ts, UserId.ts]        // User aggregate
Community 2: [Order.ts, OrderId.ts, Money.ts]      // Order aggregate
Community 3: [UserController.ts, CreateUser.ts]   // User feature
```

---

### 4.2 Modularity as Quality Metric

**Wikipedia:** https://en.wikipedia.org/wiki/Modularity_(networks)

**Definition:** Modularity measures the strength of division of a network into modules (groups, clusters, communities). Networks with high modularity have dense connections within modules but sparse connections between modules.

**Interpretation:**
| Modularity Value | Interpretation |
|------------------|----------------|
| Q < 0 | Non-modular (worse than random) |
| 0 < Q < 0.3 | Weak community structure |
| 0.3 < Q < 0.5 | Moderate community structure |
| Q > 0.5 | Strong community structure |
| Q → 1 | Perfect modularity |

**Research Reference:** "Fast Algorithm for Modularity-Based Graph Clustering" - https://cdn.aaai.org/ojs/8455/8455-13-11983-1-2-20201228.pdf

---

### 4.3 Graph-Based Software Modularization

**Research Paper:** "A graph-based clustering algorithm for software systems modularization"

**Source:** ScienceDirect - https://www.sciencedirect.com/science/article/abs/pii/S0950584920302147

**Key Points:**
- Clustering algorithms partition source code into manageable modules
- Resulting decomposition is called software system structure
- Due to NP-hardness, evolutionary approaches are commonly used
- Objectives:
  - Minimize inter-cluster connections
  - Maximize intra-cluster connections
  - Maximize overall clustering quality

---

### 4.4 Topological Sorting for Layer Detection

**Algorithm Description:**

Layers can be inferred from dependency graph topology:
- **Layer 0 (Domain)**: Nodes with no outgoing dependencies to other layers
- **Layer 1 (Application)**: Nodes depending only on Layer 0
- **Layer 2+ (Infrastructure)**: Nodes depending on lower layers

**Pseudocode:**
```
function detectLayers(graph):
    layers = Map()
    visited = Set()

    function dfs(node):
        if layers.has(node): return layers.get(node)
        if visited.has(node): return 0  // Cycle detected

        visited.add(node)
        deps = graph.getDependencies(node)

        if deps.isEmpty():
            layers.set(node, 0)  // Leaf node = Domain
            return 0

        maxDepth = max(deps.map(dfs))
        layers.set(node, maxDepth + 1)
        return maxDepth + 1

    graph.nodes.forEach(dfs)
    return layers
```

**Limitation:** Assumes acyclic graph; circular dependencies break this approach.

---

### 4.5 Graph Metrics for Code Quality Assessment

**Useful Metrics:**
| Metric | Description | Good Value |
|--------|-------------|------------|
| Modularity | Clustering quality | > 0.3 |
| Density | Edge/node ratio | Low for good separation |
| Clustering Coefficient | Local clustering | Domain-dependent |
| Cyclic Rate | % of circular deps | < 0.1 (10%) |
| Average Path Length | Mean dependency distance | Lower = more coupled |

**Code Quality Interpretation:**
```
if cyclicRate > 0.5:
    return "SPAGHETTI"  // Cannot determine architecture
if modularity < 0.2:
    return "MONOLITH"   // No clear separation
if modularity > 0.5:
    return "WELL_STRUCTURED"  // Can determine layers
return "MODERATE"
```

---

## 5. Configuration Patterns and Best Practices

### 5.1 Pattern Hierarchy

**Level 1: Minimal Configuration**
```json
{
    "architecture": "clean-architecture"
}
```

**Level 2: Custom Paths**
```json
{
    "architecture": "clean-architecture",
    "layers": {
        "domain": ["src/core", "src/domain"],
        "application": ["src/app", "src/use-cases"],
        "infrastructure": ["src/infra", "src/adapters"]
    }
}
```

**Level 3: Full Control**
```json
{
    "layers": [
        {
            "name": "domain",
            "patterns": ["src/domain/**", "**/*.entity.ts"],
            "allowDependOn": []
        },
        {
            "name": "application",
            "patterns": ["src/application/**", "**/*.use-case.ts"],
            "allowDependOn": ["domain"]
        },
        {
            "name": "infrastructure",
            "patterns": ["src/infrastructure/**", "**/*.controller.ts"],
            "allowDependOn": ["domain", "application"]
        }
    ]
}
```

---

### 5.2 Architecture Drift Detection in CI/CD

**Best Practices from Industry:**

**Source:** Firefly Academy - https://www.firefly.ai/academy/implementing-continuous-drift-detection-in-ci-cd-pipelines-with-github-actions-workflow

**Source:** Brainboard Blog - https://blog.brainboard.co/drift-detection-best-practices/

**Key Recommendations:**

1. **Integrate into Pipeline**: Validate architecture on every code update
2. **Continuous Monitoring**: Run automated scans daily minimum, hourly for active projects
3. **Enforce IaC-Only Changes**: All changes through automated workflows
4. **Automated Reconciliation**: Regular drift detection and correction
5. **Proper Alerting**: Slack for minor drift, PagerDuty for critical
6. **Least Privilege**: Limit who can bypass architecture checks
7. **Emergency Process**: Document process for urgent manual changes
8. **Environment Refresh**: Reset after each pipeline run

**Example GitHub Actions Integration:**
```yaml
name: Architecture Check

on: [push, pull_request]

jobs:
    architecture:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Check Architecture
              run: npx guardian check --strict

            - name: Generate Report
              if: failure()
              run: npx guardian report --format html

            - name: Upload Report
              if: failure()
              uses: actions/upload-artifact@v3
              with:
                  name: architecture-report
                  path: architecture-report.html
```

---

### 5.3 Presets for Common Architectures

**Clean Architecture Preset:**
```json
{
    "preset": "clean-architecture",
    "layers": {
        "domain": {
            "patterns": ["**/domain/**", "**/entities/**", "**/core/**"],
            "allowDependOn": []
        },
        "application": {
            "patterns": ["**/application/**", "**/use-cases/**", "**/services/**"],
            "allowDependOn": ["domain"]
        },
        "infrastructure": {
            "patterns": ["**/infrastructure/**", "**/adapters/**", "**/api/**"],
            "allowDependOn": ["domain", "application"]
        }
    }
}
```

**Hexagonal Architecture Preset:**
```json
{
    "preset": "hexagonal",
    "layers": {
        "core": {
            "patterns": ["**/core/**", "**/domain/**"],
            "allowDependOn": []
        },
        "ports": {
            "patterns": ["**/ports/**"],
            "allowDependOn": ["core"]
        },
        "adapters": {
            "patterns": ["**/adapters/**", "**/infrastructure/**"],
            "allowDependOn": ["core", "ports"]
        }
    }
}
```

**NestJS Preset:**
```json
{
    "preset": "nestjs",
    "layers": {
        "domain": {
            "patterns": ["**/*.entity.ts", "**/entities/**"],
            "allowDependOn": []
        },
        "application": {
            "patterns": ["**/*.service.ts", "**/*.use-case.ts"],
            "allowDependOn": ["domain"]
        },
        "infrastructure": {
            "patterns": ["**/*.controller.ts", "**/*.module.ts", "**/*.resolver.ts"],
            "allowDependOn": ["domain", "application"]
        }
    }
}
```

---

## 6. Industry Consensus

### 6.1 Why Major Tools Don't Auto-Detect

| Tool | Auto-Detection | Reasoning |
|------|----------------|-----------|
| ArchUnit | ❌ No | "User knows their architecture best" |
| eslint-plugin-boundaries | ❌ No | "Too many structure variations" |
| Nx | ❌ No | "Tag-based approach is more flexible" |
| dependency-cruiser | ❌ No | "Regex patterns cover all cases" |
| SonarQube | ⚠️ Partial | "Basic analysis + config for accuracy" |

### 6.2 Common Themes Across Tools

1. **Explicit Configuration**: All tools require user-defined rules
2. **Pattern Matching**: Glob/regex patterns are universal
3. **Layered Rules**: Allow/deny dependencies between layers
4. **CI/CD Integration**: All support pipeline integration
5. **Visualization**: Optional but valuable for understanding

### 6.3 Graph Analysis Position

Graph analysis is used for:
- ✅ Circular dependency detection
- ✅ Visualization
- ✅ Metrics calculation
- ✅ Suggestion generation

Graph analysis is NOT used for:
- ❌ Primary layer detection
- ❌ Automatic architecture classification
- ❌ Rule enforcement

---

## 7. Recommendations for Guardian

### 7.1 Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Configuration Layer                       │
├─────────────────────────────────────────────────────────────┤
│  .guardianrc.json │ package.json │ CLI args │ Interactive   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Strategy Resolver                         │
├─────────────────────────────────────────────────────────────┤
│  1. Explicit Config (if .guardianrc.json exists)            │
│  2. Preset Detection (if preset specified)                  │
│  3. Smart Defaults (standard patterns)                      │
│  4. Generic Mode (fallback - minimal checks)                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Analysis Engine                           │
├─────────────────────────────────────────────────────────────┤
│  Pattern Matcher │ Layer Detector │ Dependency Analyzer     │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Implementation Priorities

**Phase 1: Configuration File Support**
- Add `.guardianrc.json` parser
- Support custom layer patterns
- Support custom DDD folder names
- Validate configuration on load

**Phase 2: Presets System**
- Clean Architecture preset
- Hexagonal Architecture preset
- NestJS preset
- Feature-based preset

**Phase 3: Smart Defaults**
- Try standard folder names first
- Fall back to file naming patterns
- Support common conventions

**Phase 4: Interactive Setup**
- `guardian init` command
- Project structure scanning
- Configuration file generation
- Preset recommendations

**Phase 5: Generic Mode**
- Minimal checks without layer knowledge
- Hardcode detection
- Secret detection
- Circular dependency detection
- Basic naming conventions

### 7.3 Graph Analysis - Optional Feature Only

Graph analysis should be:
- **Optional**: Not required for basic functionality
- **Informational**: For visualization and metrics
- **Suggestive**: Can propose configuration, not enforce it

**CLI Commands:**
```bash
guardian analyze --graph --output deps.svg    # Visualization
guardian metrics                               # Quality metrics
guardian suggest                               # Configuration suggestions
```

---

## 8. Additional Resources

### Official Documentation

- ArchUnit: https://www.archunit.org/userguide/html/000_Index.html
- eslint-plugin-boundaries: https://github.com/javierbrea/eslint-plugin-boundaries
- SonarQube Architecture: https://docs.sonarsource.com/sonarqube-server/design-and-architecture/overview/
- Nx Module Boundaries: https://nx.dev/docs/features/enforce-module-boundaries
- dependency-cruiser: https://github.com/sverweij/dependency-cruiser

### Academic Papers

- Software Architecture Recovery (Wikipedia): https://en.wikipedia.org/wiki/Software_architecture_recovery
- ACDC Algorithm: https://www.researchgate.net/publication/221200422_ACDC_An_Algorithm_for_Comprehension-Driven_Clustering
- Louvain Method: https://en.wikipedia.org/wiki/Louvain_method
- Graph Modularity: https://en.wikipedia.org/wiki/Modularity_(networks)
- LLM-based SAR: https://link.springer.com/chapter/10.1007/978-3-032-02138-0_5

### Tutorials and Guides

- Clean Architecture Validation: https://betterprogramming.pub/validate-dependencies-according-to-clean-architecture-743077ea084c
- Drift Detection Best Practices: https://blog.brainboard.co/drift-detection-best-practices/
- Louvain Algorithm Tutorial: https://medium.com/data-science-in-your-pocket/community-detection-in-a-graph-using-louvain-algorithm-with-example-7a77e5e4b079

### Related Books

- **Clean Architecture** by Robert C. Martin (2017) - ISBN: 978-0134494166
- **Domain-Driven Design** by Eric Evans (2003) - ISBN: 978-0321125217
- **Implementing Domain-Driven Design** by Vaughn Vernon (2013) - ISBN: 978-0321834577

---

## Conclusion

The research conclusively shows that **automatic architecture detection is unreliable** and **not used by major industry tools**. The recommended approach for Guardian is:

1. **Configuration-first**: Support explicit layer definitions via `.guardianrc.json`
2. **Pattern-based**: Use glob/regex patterns for flexible matching
3. **Presets**: Provide pre-configured patterns for common architectures
4. **Smart defaults**: Try standard conventions when no config exists
5. **Generic fallback**: Provide useful checks even without architecture knowledge
6. **Graph analysis as optional**: Use for visualization and suggestions only

This approach aligns with industry best practices from ArchUnit, eslint-plugin-boundaries, SonarQube, Nx, and dependency-cruiser.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-27
**Author**: Guardian Research Team
**Questions or contributions?**
- 📧 Email: fozilbek.samiyev@gmail.com
- 🐙 GitHub: https://github.com/samiyev/puaros/issues
**Based on research as of**: November 2025
