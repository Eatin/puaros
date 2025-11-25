# Why Guardian's Rules Matter

Guardian's detection rules are not invented - they're based on decades of software engineering research, industry standards, and expert opinion from leading authorities.

**Quick Navigation:**
- [Hardcode Detection](#hardcode-detection)
- [Circular Dependencies](#circular-dependencies)
- [Clean Architecture](#clean-architecture)
- [Framework Leaks](#framework-leaks)
- [Entity Exposure](#entity-exposure)
- [Repository Pattern](#repository-pattern)
- [Naming Conventions](#naming-conventions)
- [Anemic Domain Model Detection](#anemic-domain-model-detection)
- [Aggregate Boundary Validation](#aggregate-boundary-validation)
- [Secret Detection](#secret-detection)
- [Severity-Based Prioritization](#severity-based-prioritization)
- [Full Research Citations](#full-research-citations)

---

## Hardcode Detection

### Why it matters

Magic numbers and strings make code:
- ❌ **Hard to maintain** - Changing a value requires finding all occurrences
- ❌ **Error-prone** - Typos in repeated values cause bugs
- ❌ **Difficult to understand** - What does `3000` mean without context?
- ❌ **Not ready for change** - Configuration changes require code modifications

### Who says so?

**Academia:**
- **MIT Course 6.031: Software Construction**
  > "Magic numbers fail three key measures: Safe from bugs, Easy to understand, Ready for change"
  - Used in MIT's software engineering curriculum
  - [Read the course material](https://web.mit.edu/6.031/www/sp17/classes/04-code-review/)

**Industry Standards:**
- **SonarQube Rule RSPEC-109**: "Magic numbers should not be used"
  - Used by 400,000+ organizations worldwide
  - Identifies hardcoded values as code smells
  - [View the rule](https://rules.sonarsource.com/c/rspec-109/)

**Research:**
- **2022 ScienceDirect Study**: "What do developers consider magic literals?"
  - Analyzed 24,000 literals from 3,500+ methods
  - Surveyed 26 professional developers
  - [Read the paper](https://www.sciencedirect.com/science/article/abs/pii/S0950584922000908)

**Historical Context:**
- Anti-pattern dating back to 1960s COBOL/FORTRAN manuals
- One of the oldest rules of programming

[Read full research →](./RESEARCH_CITATIONS.md#1-hardcode-detection-magic-numbers--strings)

---

## Circular Dependencies

### Why it matters

Circular dependencies create:
- ❌ **Tight coupling** - Components cannot evolve independently
- ❌ **Testing difficulties** - Impossible to test modules in isolation
- ❌ **Maintenance nightmares** - Changes cause ripple effects across codebase
- ❌ **Build complexity** - Compilation order becomes problematic

### Who says so?

**Expert Opinion:**
- **Martin Fowler**: Enterprise architecture patterns expert
  > "Putting abstract classes in supertype package is good way of breaking cycles in the dependency structure"
  - Recommends using abstraction to break cycles
  - [Read on TechTarget](https://www.techtarget.com/searchapparchitecture/tip/The-vicious-cycle-of-circular-dependencies-in-microservices)

**Real-world Solutions:**
- **Shopify Engineering**: "Remove Circular Dependencies by Using Dependency Injection"
  - Demonstrates practical application of Repository Pattern
  - Production-proven solution from major tech company
  - [Read the article](https://shopify.engineering/repository-pattern-ruby)

**Impact Studies:**
- Services become hardly maintainable and highly coupled
- Open the door to error-prone applications
- Components cannot be tested in isolation

[Read full research →](./RESEARCH_CITATIONS.md#2-circular-dependencies)

---

## Clean Architecture

### Why it matters

Clean Architecture principles ensure:
- ✅ **Independence** - Business rules don't depend on frameworks
- ✅ **Testability** - Business logic can be tested without UI/DB
- ✅ **Flexibility** - Easy to swap frameworks and tools
- ✅ **Maintainability** - Clear boundaries and responsibilities

### The Dependency Rule

**Robert C. Martin's Core Principle:**
> "Source code dependencies can only point inwards. Nothing in an inner circle can know anything about something in an outer circle."

**Layer Flow:**
```
Domain (innermost) ← Application ← Infrastructure (outermost)
```

### Who says so?

**The Definitive Book:**
- **Robert C. Martin (Uncle Bob): "Clean Architecture" (2017)**
  - Published by O'Reilly (Prentice Hall)
  - Based on SOLID principles and decades of experience
  - [Get the book](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)

**Core Principles:**
- **SOLID Principles (2000)**: Foundation of Clean Architecture
  - Single Responsibility Principle
  - Open-Closed Principle
  - Liskov Substitution Principle
  - Interface Segregation Principle
  - **Dependency Inversion Principle** (critical for layer separation)
  - [Learn SOLID](https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)

**The Clean Architecture Blog:**
- Original blog post by Uncle Bob (2012)
- Defines the concentric circles architecture
- [Read the original](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

[Read full research →](./RESEARCH_CITATIONS.md#3-clean-architecture--layered-architecture)

---

## Framework Leaks

### Why it matters

Framework dependencies in domain layer:
- ❌ **Coupling to infrastructure** - Business logic tied to technical details
- ❌ **Testing difficulties** - Cannot test without framework setup
- ❌ **Framework lock-in** - Migration becomes impossible
- ❌ **Violates Clean Architecture** - Breaks the Dependency Rule

### Who says so?

**Original Research:**
- **Alistair Cockburn (2005): "Hexagonal Architecture"**
  - HaT Technical Report 2005.02
  > "Create your application to work without either a UI or a database so you can run automated regression-tests against the application, work when the database becomes unavailable, and link applications together without any user involvement."
  - Original Ports & Adapters pattern
  - [Read the original paper](https://alistair.cockburn.us/hexagonal-architecture)

**Industry Adoption:**
- **Robert C. Martin: "Clean Architecture" (2017)**
  > "Frameworks are tools, not architectures"
  - Frameworks belong in outer layers only

- **AWS Prescriptive Guidance**: Documents hexagonal architecture patterns
- **GitHub: Domain-Driven Hexagon**: Comprehensive implementation guide
  - [View the guide](https://github.com/Sairyss/domain-driven-hexagon)

**Key Insight:**
The goal is to isolate the application's business logic from external resources like databases, message queues, HTTP frameworks, etc.

[Read full research →](./RESEARCH_CITATIONS.md#4-framework-leak-detection)

---

## Entity Exposure

### Why it matters

Exposing domain entities directly:
- ❌ **Breaks encapsulation** - Exposes internal domain structure
- ❌ **Security risks** - May leak sensitive data (passwords, tokens)
- ❌ **Coupling** - API tied to domain model changes
- ❌ **Violates Single Responsibility** - Entities serve two purposes

### Use DTOs Instead

**Data Transfer Object (DTO) Pattern:**
- Transform domain entities into simple data structures
- Control exactly what data is exposed
- Decouple API contracts from domain model
- Separate concerns: domain logic vs. data transfer

### Who says so?

**The Definitive Source:**
- **Martin Fowler: "Patterns of Enterprise Application Architecture" (2002)**
  - Defines the DTO pattern
  - Published by Addison-Wesley
  > "An object that carries data between processes in order to reduce the number of method calls"
  - [Read on martinfowler.com](https://martinfowler.com/eaaCatalog/dataTransferObject.html)

**Purpose:**
- Originally designed to batch remote calls and reduce network overhead
- Modern use: Separate domain model from external representation
- Prevents "God objects" that do too much

**Warning: LocalDTO Anti-pattern:**
Martin Fowler also warns about overusing DTOs in local contexts where they add unnecessary complexity.

[Read full research →](./RESEARCH_CITATIONS.md#5-entity-exposure-dto-pattern)

---

## Repository Pattern

### Why it matters

Repository pattern provides:
- ✅ **Abstraction** - Domain doesn't know about persistence details
- ✅ **Testability** - Easy to mock data access in tests
- ✅ **Centralized queries** - Single place for data access logic
- ✅ **Clean separation** - Domain logic separate from data access

### Common Violations

Guardian detects:
- ORM types leaking into repository interfaces
- Technical method names (`findOne`, `save`) instead of domain language
- Direct ORM/database usage in use cases
- `new Repository()` instantiation (should use DI)

### Who says so?

**The Definitive Source:**
- **Martin Fowler: Enterprise Application Architecture Catalog**
  > "Mediates between the domain and data mapping layers using a collection-like interface for accessing domain objects"
  - Part of the Domain Logic Patterns
  - [Read on martinfowler.com](https://martinfowler.com/eaaCatalog/repository.html)

**Key Benefits:**
- Minimizes duplicate query logic
- Allows multiple repositories for different storage needs
- Domain layer doesn't know about SQL, MongoDB, or any specific technology

**Additional Support:**
- **Microsoft Learn**: Official documentation on Repository Pattern
- **Eric Evans**: Referenced in Domain-Driven Design book
- **Listed as**: Data Source Architectural Pattern

**Real-world Example:**
```typescript
// ❌ Bad: ORM leak in interface
interface IUserRepository {
    findOne(query: PrismaWhereInput): Promise<User>
}

// ✅ Good: Domain language
interface IUserRepository {
    findByEmail(email: Email): Promise<User | null>
    findById(id: UserId): Promise<User | null>
}
```

[Read full research →](./RESEARCH_CITATIONS.md#6-repository-pattern)

---

## Naming Conventions

### Why it matters

Consistent naming:
- ✅ **Readability** - Code is self-documenting
- ✅ **Predictability** - Developers know what to expect
- ✅ **Maintainability** - Easier to navigate large codebases
- ✅ **Team alignment** - Everyone follows same patterns

### Guardian's Conventions

**Domain Layer:**
- Entities: `User.ts`, `Order.ts` (PascalCase nouns)
- Services: `UserService.ts` (PascalCase + Service suffix)
- Repositories: `IUserRepository.ts` (I prefix for interfaces)

**Application Layer:**
- Use cases: `CreateUser.ts`, `PlaceOrder.ts` (Verb + Noun)
- DTOs: `UserDto.ts`, `CreateUserRequest.ts` (Dto/Request/Response suffix)
- Mappers: `UserMapper.ts` (Mapper suffix)

**Infrastructure Layer:**
- Controllers: `UserController.ts` (Controller suffix)
- Repositories: `MongoUserRepository.ts` (implementation name + Repository)

### Who says so?

**Industry Style Guides:**

- **Google Java Style Guide**
  - PascalCase for classes
  - camelCase for methods and variables
  - [Read the guide](https://google.github.io/styleguide/javaguide.html)

- **Airbnb JavaScript Style Guide**
  - 145,000+ GitHub stars
  - Industry standard for JavaScript/TypeScript
  - [Read the guide](https://github.com/airbnb/javascript)

- **Microsoft .NET Guidelines**
  - PascalCase for types and public members
  - Consistent across entire .NET ecosystem
  - Widely adopted in C# and TypeScript communities

**Use Case Naming:**
- **TM Forum Standard**: Verb + Noun pattern for operations
  - Actions start with verbs: Create, Update, Delete, Get, Process
  - Clear intent from filename
  - Examples: `ProcessOrder.ts`, `ValidateInput.ts`

**General Principle:**
- **Wikipedia: Naming Convention (Programming)**
  - "Classes are nouns, methods are verbs"
  - Widely accepted across languages and paradigms

[Read full research →](./RESEARCH_CITATIONS.md#7-naming-conventions)

---

## Anemic Domain Model Detection

### Why it matters

Anemic domain models violate core OOP principles:
- ❌ **No behavior** - Entities become data bags with only getters/setters
- ❌ **Logic in services** - Business logic scattered across service layers
- ❌ **Violates OOP** - Separates data from behavior
- ❌ **Higher complexity** - Loses benefits of domain modeling

### Who says so?

**Martin Fowler's Original Anti-Pattern:**
- **Blog Post: "Anemic Domain Model"** (November 25, 2003)
  > "The basic symptom of an Anemic Domain Model is that at first blush it looks like the real thing. There are objects, many named after the nouns in the domain space... The catch comes when you look at the behavior, and you realize that there is hardly any behavior on these objects."
  - Published over 20 years ago, still relevant today
  - [Read Fowler's post](https://martinfowler.com/bliki/AnemicDomainModel.html)

**Why It's an Anti-pattern:**
> "This is contrary to the basic idea of object-oriented design; which is to combine data and process together."
- Incurs all costs of domain model without any benefits
- Logic should be in domain objects: validations, calculations, business rules
- [Wikipedia - Anemic Domain Model](https://en.wikipedia.org/wiki/Anemic_domain_model)

**Rich Domain Model vs Transaction Script:**
- **Transaction Script**: Good for simple logic (Fowler, 2002)
- **Rich Domain Model**: Better for complex, ever-changing business rules
- Can refactor from Transaction Script to Domain Model, but it's harder than starting right
- [Martin Fowler - Transaction Script](https://martinfowler.com/eaaCatalog/transactionScript.html)

**Domain-Driven Design Context:**
- **Eric Evans (2003)**: Entities should have both identity AND behavior
- Anemic models violate DDD by separating data from behavior
- [Stack Overflow discussion](https://stackoverflow.com/questions/6293981/concrete-examples-on-why-the-anemic-domain-model-is-considered-an-anti-pattern)

[Read full research →](./RESEARCH_CITATIONS.md#11-anemic-domain-model-detection)

---

## Aggregate Boundary Validation

### Why it matters

Proper aggregate boundaries ensure:
- ✅ **Consistency** - Atomic changes within boundaries
- ✅ **Low coupling** - Aggregates are loosely connected
- ✅ **Clear transactions** - One aggregate = one transaction
- ✅ **Maintainability** - Boundaries prevent complexity spread

### The Rules

**Vaughn Vernon's Four Rules (2013):**
1. **Model True Invariants in Consistency Boundaries**
2. **Design Small Aggregates**
3. **Reference Other Aggregates by Identity**
4. **Use Eventual Consistency Outside the Boundary**

### Who says so?

**Eric Evans: Domain-Driven Design (2003)**
- **Original Definition**:
  > "A cluster of associated objects that we treat as a unit for the purpose of data changes"
- An aggregate defines a consistency boundary
- Exactly one entity is the aggregate root
- [Microsoft Learn - Tactical DDD](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd)

**Vaughn Vernon: Implementing Domain-Driven Design (2013)**
- **Chapter 10: Aggregates** (Page 347)
- ISBN: 978-0321834577
- Comprehensive rules for aggregate design
- Three-part essay series: "Effective Aggregate Design"
- [Available at Kalele](https://kalele.io/effective-aggregate-design/)

**Why Boundaries Matter:**
- **Transactional Boundary**: Changes must be atomic
- **Reference by ID**: No direct entity references across aggregates
- **Prevents tight coupling**: Maintains clear boundaries
- [Medium - Mastering Aggregate Design](https://medium.com/ssense-tech/ddd-beyond-the-basics-mastering-aggregate-design-26591e218c8c)

**Microsoft Azure Documentation:**
- Official guide for microservices architecture
- Comprehensive aggregate boundary patterns
- [Microsoft Learn - Tactical DDD](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/tactical-ddd)

[Read full research →](./RESEARCH_CITATIONS.md#12-aggregate-boundary-validation-ddd-tactical-patterns)

---

## Secret Detection

### Why it matters

Hardcoded secrets create critical security risks:
- 🔴 **Data breaches** - Exposed credentials lead to unauthorized access
- 🔴 **Production incidents** - Leaked tokens cause service disruptions
- 🔴 **Compliance violations** - GDPR, PCI-DSS, SOC 2 requirements
- 🔴 **Impossible to rotate** - Secrets in code are difficult to change

### Who says so?

**OWASP Security Standards:**
- **OWASP Secrets Management Cheat Sheet**
  > "Secrets should not be hardcoded, should not be unencrypted, and should not be stored in source code."
  - Official best practices from OWASP Foundation
  - [Read the cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

- **OWASP Hardcoded Password Vulnerability**
  > "It is never a good idea to hardcode a password, as it allows all of the project's developers to view the password and makes fixing the problem extremely difficult."
  - [OWASP Documentation](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)

**GitHub Secret Scanning:**
- **Official GitHub Documentation**
  - Automatically scans 350+ secret patterns
  - Detects AWS, GitHub, NPM, SSH, GCP, Slack tokens
  - AI-powered detection with Copilot Secret Scanning
  - [GitHub Docs](https://docs.github.com/code-security/secret-scanning/about-secret-scanning)

**Key Security Principles:**
- **Centralized Management**: Use purpose-built secret management tools
- **Prevention Tools**: Pre-commit hooks to prevent secrets entering codebase
- **Encryption at Rest**: Never store secrets in plaintext
- [OWASP SAMM - Secret Management](https://owaspsamm.org/model/implementation/secure-deployment/stream-b/)

**Mobile Security:**
- OWASP: "Secrets security is the most important issue for mobile applications"
- Only safe way: keep secrets off the client side entirely
- [GitGuardian - OWASP Top 10 Mobile](https://blog.gitguardian.com/owasp-top-10-for-mobile-secrets/)

[Read full research →](./RESEARCH_CITATIONS.md#13-secret-detection--security)

---

## Severity-Based Prioritization

### Why it matters

Severity classification enables:
- ✅ **Focus on critical issues** - Fix what matters most first
- ✅ **Reduced technical debt** - Prioritize based on impact
- ✅ **Better CI/CD integration** - Fail builds on critical issues only
- ✅ **Team efficiency** - Don't waste time on low-impact issues

### Who says so?

**Academic Research:**
- **Systematic Literature Review (2020)**
  - Title: "A systematic literature review on Technical Debt prioritization"
  - Analyzed 557 papers, included 44 primary studies
  - Finding: Need for consensus on severity factors
  - [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S016412122030220X)

- **IEEE Conference Paper (2021)**
  - "Technical Debt Prioritization: Taxonomy, Methods Results"
  - Reviewed 112 studies
  - Classified methods in 10 categories
  - [IEEE Xplore](https://ieeexplore.ieee.org/document/9582595/)

- **Software Quality Journal (2023)**
  - "Identifying the severity of technical debt issues"
  - Problem: Most studies ignore severity degree
  - Proposed semantic + structural approach
  - [Springer](https://link.springer.com/article/10.1007/s11219-023-09651-3)

**SonarQube Industry Standard:**
- **Current Classification (10.2+)**:
  - **Blocker/High**: Severe unintended consequences, fix immediately
  - **Medium**: Impacts developer productivity
  - **Low**: Slight impact on productivity
  - **Info**: No expected impact
  - [SonarQube Docs](https://docs.sonarsource.com/sonarqube-server/user-guide/code-metrics/metrics-definition)

**Real-World Impact:**
- Development teams integrate models into CI/CD pipelines
- Automatically flag potential TD issues during code reviews
- Prioritize based on severity
- [arXiv - Technical Debt Management](https://arxiv.org/html/2403.06484v1)

**Business Alignment:**
- "Aligning Technical Debt Prioritization with Business Objectives" (2018)
- Multiple-case study demonstrating importance
- [ResearchGate](https://www.researchgate.net/publication/328903587_Aligning_Technical_Debt_Prioritization_with_Business_Objectives_A_Multiple-Case_Study)

[Read full research →](./RESEARCH_CITATIONS.md#14-severity-based-prioritization--technical-debt)

---

## Full Research Citations

For complete academic papers, books, and authoritative sources, see:

📚 **[RESEARCH_CITATIONS.md](./RESEARCH_CITATIONS.md)**

This document contains:
- 50+ authoritative references
- Academic papers with DOI/URLs
- Book citations with authors and publication years
- Industry standards from Google, Microsoft, AWS
- Expert blogs from Martin Fowler, Uncle Bob, Kent Beck
- Historical context dating back to 1960s

---

## Quality Standards

Guardian's rules align with international standards:

**ISO/IEC 25010:2011 (Software Quality Standard)**
- Eight quality characteristics including **Maintainability**
- Sub-characteristics: Modularity, Reusability, Analysability, Modifiability, Testability
- [Learn more](https://www.iso.org/standard/35733.html)

**SQuaRE Framework:**
- System and Software Quality Requirements and Evaluation
- Used throughout software development lifecycle

---

## Summary: Why Trust Guardian?

Guardian's rules are backed by:

✅ **6 Seminal Books** (1993-2017)
- Clean Architecture (Robert C. Martin, 2017)
- Implementing Domain-Driven Design (Vaughn Vernon, 2013)
- Domain-Driven Design (Eric Evans, 2003)
- Patterns of Enterprise Application Architecture (Martin Fowler, 2002)
- Refactoring (Martin Fowler, 1999)
- Code Complete (Steve McConnell, 1993)

✅ **Academic Research** (1976-2024)
- MIT Course 6.031
- ScienceDirect peer-reviewed studies (2020-2023)
- IEEE Conference papers on Technical Debt
- Software Quality Journal (2023)
- Cyclomatic Complexity (Thomas McCabe, 1976)

✅ **Security Standards**
- OWASP Secrets Management Cheat Sheet
- GitHub Secret Scanning (350+ patterns)
- OWASP Top 10 for Mobile

✅ **International Standards**
- ISO/IEC 25010:2011

✅ **Industry Giants**
- Google, Microsoft, Airbnb style guides
- SonarQube (400,000+ organizations)
- AWS documentation
- GitHub security practices

✅ **Thought Leaders**
- Martin Fowler, Robert C. Martin (Uncle Bob), Eric Evans
- Vaughn Vernon, Alistair Cockburn, Kent Beck, Thomas McCabe

---

**Questions or want to contribute research?**

- 📧 Email: fozilbek.samiyev@gmail.com
- 🐙 GitHub: https://github.com/samiyev/puaros/issues
- 📚 Full citations: [RESEARCH_CITATIONS.md](./RESEARCH_CITATIONS.md)

---

*Last updated: 2025-11-26*