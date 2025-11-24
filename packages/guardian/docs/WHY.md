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

✅ **5 Seminal Books** (1993-2017)
- Clean Architecture (Robert C. Martin, 2017)
- Domain-Driven Design (Eric Evans, 2003)
- Patterns of Enterprise Application Architecture (Martin Fowler, 2002)
- Refactoring (Martin Fowler, 1999)
- Code Complete (Steve McConnell, 1993)

✅ **Academic Research** (1976-2024)
- MIT Course 6.031
- ScienceDirect peer-reviewed studies
- Cyclomatic Complexity (Thomas McCabe, 1976)

✅ **International Standards**
- ISO/IEC 25010:2011

✅ **Industry Giants**
- Google, Microsoft, Airbnb style guides
- SonarQube (400,000+ organizations)
- AWS documentation

✅ **Thought Leaders**
- Martin Fowler, Robert C. Martin (Uncle Bob), Eric Evans
- Alistair Cockburn, Kent Beck, Thomas McCabe

---

**Questions or want to contribute research?**

- 📧 Email: fozilbek.samiyev@gmail.com
- 🐙 GitHub: https://github.com/samiyev/puaros/issues
- 📚 Full citations: [RESEARCH_CITATIONS.md](./RESEARCH_CITATIONS.md)

---

*Last updated: 2025-11-24*