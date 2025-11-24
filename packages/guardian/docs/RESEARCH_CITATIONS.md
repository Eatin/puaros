# Research Citations for Code Quality Detection Rules

This document provides authoritative sources, academic papers, industry standards, and expert references that support the code quality detection rules implemented in Guardian. These rules are not invented but based on established software engineering principles and best practices.

---

## Table of Contents

1. [Hardcode Detection (Magic Numbers & Strings)](#1-hardcode-detection-magic-numbers--strings)
2. [Circular Dependencies](#2-circular-dependencies)
3. [Clean Architecture / Layered Architecture](#3-clean-architecture--layered-architecture)
4. [Framework Leak Detection](#4-framework-leak-detection)
5. [Entity Exposure (DTO Pattern)](#5-entity-exposure-dto-pattern)
6. [Repository Pattern](#6-repository-pattern)
7. [Naming Conventions](#7-naming-conventions)
8. [General Software Quality Standards](#8-general-software-quality-standards)
9. [Code Complexity Metrics](#9-code-complexity-metrics)
10. [Additional Authoritative Sources](#10-additional-authoritative-sources)

---

## 1. Hardcode Detection (Magic Numbers & Strings)

### Academic Research

**What do developers consider magic literals? A smalltalk perspective** (2022)
- Published in ScienceDirect
- Conducted qualitative and quantitative studies on magic literals
- Analyzed 26 developers reviewing about 24,000 literals from more than 3,500 methods
- Studies ranged from small (four classes) to large (7,700 classes) systems
- Reference: [ScienceDirect Article](https://www.sciencedirect.com/science/article/abs/pii/S0950584922000908)

### Industry Standards

**MIT Course 6.031: Software Construction - Code Review**
- Magic numbers fail three key measures of code quality:
  - Not safe from bugs (SFB)
  - Not easy to understand (ETU)
  - Not ready for change (RFC)
- Reference: [MIT Reading 4: Code Review](https://web.mit.edu/6.031/www/sp17/classes/04-code-review/)

**SonarQube Static Analysis Rules**
- Rule RSPEC-109: "Magic numbers should not be used"
- Identifies hardcoded values and magic numbers as code smells
- Reference: [SonarSource C Rule RSPEC-109](https://rules.sonarsource.com/c/rspec-109/)

### Historical Context

**Wikipedia: Magic Number (Programming)**
- Anti-pattern that breaks one of the oldest rules of programming
- Dating back to COBOL, FORTRAN, and PL/1 manuals of the 1960s
- Defined as "using a numeric literal in source code that has a special meaning that is less than clear"
- Reference: [Wikipedia - Magic Number](https://en.wikipedia.org/wiki/Magic_number_(programming))

### Best Practices

**DRY Principle Violation**
- Magic numbers violate the DRY (Don't Repeat Yourself) principle
- Encourage duplicated hardcoded values instead of centralized definitions
- Make code brittle and prone to errors
- Reference: [Stack Overflow - What are magic numbers](https://stackoverflow.com/questions/47882/what-are-magic-numbers-and-why-do-some-consider-them-bad)

---

## 2. Circular Dependencies

### Expert Opinion

**Martin Fowler on Breaking Cycles**
- "Putting abstract classes in supertype package is good way of breaking cycles in the dependency structure"
- Suggests using abstraction as a technique to break circular dependencies
- Reference: [TechTarget - Circular Dependencies in Microservices](https://www.techtarget.com/searchapparchitecture/tip/The-vicious-cycle-of-circular-dependencies-in-microservices)

### Impact on Software Quality

**Maintainability Issues**
- Circular dependencies make code difficult to read and maintain over time
- Open the door to error-prone applications that are difficult to test
- Changes to a single module cause a large ripple effect of errors
- Reference: [TechTarget - Circular Dependencies](https://www.techtarget.com/searchapparchitecture/tip/The-vicious-cycle-of-circular-dependencies-in-microservices)

**Component Coupling**
- "You can't change or evolve components independently of each other"
- Services become hardly maintainable and highly coupled
- Components cannot be tested in isolation
- Reference: [DEV Community - Circular Dependencies Between Microservices](https://dev.to/cloudx/circular-dependencies-between-microservices-11hn)

### Solution Patterns

**Shopify Engineering: Repository Pattern**
- "Remove Circular Dependencies by Using Dependency Injection and the Repository Pattern in Ruby"
- Demonstrates practical application of breaking circular dependencies
- Reference: [Shopify Engineering](https://shopify.engineering/repository-pattern-ruby)

---

## 3. Clean Architecture / Layered Architecture

### The Dependency Rule - Robert C. Martin

**Book: Clean Architecture: A Craftsman's Guide to Software Structure and Design** (2017)
- Author: Robert C. Martin (Uncle Bob)
- Publisher: Prentice Hall
- ISBN: 978-0134494166
- Available at: [Amazon](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)

**The Dependency Rule (Core Principle)**
- "Source code dependencies can only point inwards"
- "Nothing in an inner circle can know anything at all about something in an outer circle"
- "The name of something declared in an outer circle must not be mentioned by the code in the inner circle"
- Reference: [The Clean Architecture Blog Post](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

**Layer Organization**
- Dependencies flow towards higher-level policies and domain logic
- Inner layers (domain) should not depend on outer layers (infrastructure)
- Use dynamic polymorphism to create source code dependencies that oppose the flow of control
- Reference: [Clean Architecture Beginner's Guide](https://betterprogramming.pub/the-clean-architecture-beginners-guide-e4b7058c1165)

**O'Reilly Resources**
- Complete book available through O'Reilly Learning Platform
- Reference: [O'Reilly - Clean Architecture](https://www.oreilly.com/library/view/clean-architecture-a/9780134494272/)

### SOLID Principles - Robert C. Martin

**Paper: Design Principles and Design Patterns** (2000)
- Author: Robert C. Martin
- Introduced the basic principles of SOLID design
- SOLID acronym coined by Michael Feathers around 2004
- Reference: [Wikipedia - SOLID](https://en.wikipedia.org/wiki/SOLID)

**Dependency Inversion Principle (DIP)**
- High-level modules should not depend on low-level modules; both should depend on abstractions
- Abstractions should not depend on details; details should depend on abstractions
- Enables loosely coupled components and simpler testing
- Reference: [DigitalOcean - SOLID Principles](https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)

**Single Responsibility Principle (SRP)**
- "There should never be more than one reason for a class to change"
- Every class should have only one responsibility
- Classes with single responsibility are easier to understand, test, and modify
- Reference: [Real Python - SOLID Principles](https://realpython.com/solid-principles-python/)

---

## 4. Framework Leak Detection

### Hexagonal Architecture (Ports & Adapters)

**Original Paper: The Hexagonal (Ports & Adapters) Architecture** (2005)
- Author: Alistair Cockburn
- Document: HaT Technical Report 2005.02
- Date: 2005-09-04 (v 0.9)
- Intent: "Allow an application to equally be driven by users, programs, automated test or batch scripts, and to be developed and tested in isolation from its eventual run-time devices and databases"
- Reference: [Alistair Cockburn - Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture)

### Domain-Driven Design (DDD) and Hexagonal Architecture

**Domain-Driven Hexagon Repository**
- Comprehensive guide combining DDD with hexagonal architecture
- "Application Core shouldn't depend on frameworks or access external resources directly"
- "External calls should be done through ports (interfaces)"
- Reference: [GitHub - Domain-Driven Hexagon](https://github.com/Sairyss/domain-driven-hexagon)

**AWS Prescriptive Guidance**
- "The hexagonal architecture pattern is used to isolate business logic (domain logic) from related infrastructure code"
- Outer layers can depend on inner layers, but inner layers never depend on outer layers
- Reference: [AWS - Hexagonal Architecture Pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/hexagonal-architecture.html)

### Preventing Logic Leakage

**Ports and Adapters Benefits**
- Shields domain logic from leaking out of application's core
- Prevents technical details (like JPA entities) and libraries (like O/R mappers) from leaking into application
- Keeps application agnostic of external actors
- Reference: [Medium - Hexagonal Architecture](https://medium.com/ssense-tech/hexagonal-architecture-there-are-always-two-sides-to-every-story-bc0780ed7d9c)

**Herberto Graca's Explicit Architecture**
- "DDD, Hexagonal, Onion, Clean, CQRS, … How I put it all together"
- Comprehensive guide on preventing architectural leakage
- Reference: [Herberto Graca's Blog](https://herbertograca.com/2017/11/16/explicit-architecture-01-ddd-hexagonal-onion-clean-cqrs-how-i-put-it-all-together/)

---

## 5. Entity Exposure (DTO Pattern)

### Martin Fowler's Pattern Definition

**Book: Patterns of Enterprise Application Architecture** (2002)
- Author: Martin Fowler
- Publisher: Addison-Wesley
- First introduced the Data Transfer Object (DTO) pattern
- Reference: [Martin Fowler - Data Transfer Object](https://martinfowler.com/eaaCatalog/dataTransferObject.html)

**DTO Pattern Purpose**
- "The main reason for using a Data Transfer Object is to batch up what would be multiple remote calls into a single call"
- "DTOs are called Data Transfer Objects because their whole purpose is to shift data in expensive remote calls"
- Part of implementing a coarse-grained interface needed for remote performance
- Reference: [Martin Fowler's EAA Catalog](https://martinfowler.com/eaaCatalog/dataTransferObject.html)

### LocalDTO Anti-Pattern

**Martin Fowler on Local DTOs**
- "In a local context, DTOs are not just unnecessary but actually harmful"
- Harmful because coarse-grained API is more difficult to use
- Requires extra work moving data from domain/data source layer into DTOs
- Reference: [Martin Fowler - LocalDTO](https://martinfowler.com/bliki/LocalDTO.html)

### Security and Encapsulation Benefits

**Baeldung: The DTO Pattern**
- DTOs provide only relevant information to the client
- Hide sensitive data like passwords for security reasons
- Decoupling persistence model from domain model reduces risk of exposing domain model
- Reference: [Baeldung - DTO Pattern](https://www.baeldung.com/java-dto-pattern)

**Wikipedia: Data Transfer Object**
- Carries data between processes
- Reduces the number of method calls
- Industry-standard pattern for API design
- Reference: [Wikipedia - Data Transfer Object](https://en.wikipedia.org/wiki/Data_transfer_object)

---

## 6. Repository Pattern

### Martin Fowler's Pattern Definition

**Book: Patterns of Enterprise Application Architecture** (2002)
- Author: Martin Fowler
- Publisher: Addison-Wesley
- ISBN: 978-0321127426
- Available at: [Internet Archive](https://archive.org/details/PatternsOfEnterpriseApplicationArchitectureByMartinFowler)

**Repository Pattern Definition**
- "Mediates between the domain and data mapping layers using a collection-like interface for accessing domain objects"
- Listed under Data Source Architectural Patterns
- Main goal: separate domain logic from data persistence logic
- Reference: [Martin Fowler - Repository](https://martinfowler.com/eaaCatalog/repository.html)

**Pattern Purpose**
- "Adding this layer helps minimize duplicate query logic"
- Original definition: "all about minimizing duplicate query logic"
- Chapter 13 of online ebook at O'Reilly
- Reference: [Martin Fowler's EAA Catalog](https://martinfowler.com/eaaCatalog/)

### Microsoft Guidance

**Microsoft Learn: Infrastructure Persistence Layer Design**
- "Designing the infrastructure persistence layer" for microservices and DDD
- Official Microsoft documentation on repository pattern usage
- Reference: [Microsoft Learn - Repository Pattern](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design)

### Domain-Driven Design Context

**Eric Evans Reference**
- "You can also find a good write-up of this pattern in Domain Driven Design"
- Repository is a key tactical pattern in DDD
- Reference: [Stack Overflow - Repository Pattern Author](https://softwareengineering.stackexchange.com/questions/132813/whos-the-author-creator-of-the-repository-pattern)

---

## 7. Naming Conventions

### Use Case Naming

**Use Case Naming Convention: Verb + Noun**
- Default naming pattern: "(Actor) Verb Noun" with actor being optional
- Name must be in the form of VERB-OBJECT with verb in imperative mode
- Examples: "Customer Process Order", "Send Notification"
- Reference: [TM Forum - Use Case Naming Conventions](https://tmforum-oda.github.io/oda-ca-docs/canvas/usecase-library/use-case-naming-conventions.html)

**Good Use Case Names**
- Use meaningful verbs, not generic ones like "Process"
- Specific actions like "Validate the Ordered Items"
- Name must be unique
- Reference: [Tyner Blain - How to Write Good Use Case Names](https://tynerblain.com/blog/2007/01/22/how-to-write-good-use-case-names/)

### Industry Style Guides

**Google Java Style Guide**
- Method names are written in lowerCamelCase
- Class names should be in PascalCase
- Class names are typically nouns or noun phrases (e.g., Character, ImmutableList)
- Reference: [Google Java Style Guide](https://google.github.io/styleguide/javaguide.html)

**Airbnb JavaScript Style Guide**
- Avoid single letter names; be descriptive with naming
- Use camelCase when naming objects, functions, and instances
- Use PascalCase when exporting constructor/class/singleton
- Filename should be identical to function's name
- Reference: [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

**Microsoft Naming Conventions**
- Variables, methods, instance fields: camelCase
- Class and interface names: PascalCase (capitalized CamelCase)
- Constants: CONSTANT_CASE (all uppercase with underscores)
- Reference: [GeeksforGeeks - Java Naming Conventions](https://www.geeksforgeeks.org/java/java-naming-conventions/)

### General Naming Patterns

**Wikipedia: Naming Conventions**
- Classes are nouns or noun phrases
- Methods/functions are verbs or verb phrases to identify actions
- Established convention across multiple programming languages
- Reference: [Wikipedia - Naming Convention](https://en.wikipedia.org/wiki/Naming_convention_(programming))

**Devopedia: Naming Conventions**
- Comprehensive coverage of naming conventions across languages
- Historical context and evolution of naming standards
- Reference: [Devopedia - Naming Conventions](https://devopedia.org/naming-conventions)

---

## 8. General Software Quality Standards

### ISO/IEC 25010 Software Quality Model

**ISO/IEC 25010:2011 (Updated 2023)**
- Title: "Systems and software engineering – Systems and software Quality Requirements and Evaluation (SQuaRE) – System and software quality models"
- Defines eight software quality characteristics
- Reference: [ISO 25010 Official Standard](https://www.iso.org/standard/35733.html)

**Eight Quality Characteristics**
1. Functional suitability
2. Performance efficiency
3. Compatibility
4. Usability
5. Reliability
6. Security
7. Maintainability
8. Portability

**Maintainability Sub-characteristics**
- **Modularity**: Components can be changed with minimal impact on other components
- **Reusability**: Assets can be used in more than one system
- **Analysability**: Effectiveness of impact assessment and failure diagnosis
- **Modifiability**: System can be modified without introducing defects
- **Testability**: Test criteria effectiveness and execution
- Reference: [ISO 25000 Portal](https://iso25000.com/index.php/en/iso-25000-standards/iso-25010)

**Practical Application**
- Used throughout software development lifecycle
- Define quality requirements and evaluate products
- Static analysis plays key role in security and maintainability
- Reference: [Perforce - What is ISO 25010](https://www.perforce.com/blog/qac/what-is-iso-25010)

### SQuaRE Framework

**ISO/IEC 25000 Series**
- System and Software Quality Requirements and Evaluation (SQuaRE)
- Contains framework to evaluate software product quality
- Derived from earlier ISO/IEC 9126 standard
- Reference: [Codacy Blog - ISO 25010 Software Quality Model](https://blog.codacy.com/iso-25010-software-quality-model)

---

## 9. Code Complexity Metrics

### Cyclomatic Complexity

**Original Work: Thomas McCabe** (1976)
- Developed by Thomas McCabe in 1976
- Derived from graph theory
- Measures "the amount of decision logic in a source code function"
- Quantifies the number of independent paths through program's source code
- Reference: [Wikipedia - Cyclomatic Complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity)

**NIST Recommendations**
- NIST235 indicates that a limit of 10 is a good starting point
- Original limit of 10 proposed by McCabe has significant supporting evidence
- Limits as high as 15 have been used successfully
- Reference: [Microsoft Learn - Cyclomatic Complexity](https://learn.microsoft.com/en-us/visualstudio/code-quality/code-metrics-cyclomatic-complexity)

**Research Findings**
- Positive correlation between cyclomatic complexity and defects
- Functions with highest complexity tend to contain the most defects
- "The SATC has found the most effective evaluation is a combination of size and (Cyclomatic) complexity"
- Modules with both high complexity and large size have lowest reliability
- Reference: [Wikipedia - Cyclomatic Complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity)

### Cognitive Complexity - SonarQube

**Cognitive Complexity Definition**
- Measure of how hard it is to understand code's control flow
- Code with high cognitive complexity is hard to read, understand, test, and modify
- Incremented when code breaks normal linear reading flow
- Reference: [SonarSource - Cognitive Complexity](https://www.sonarsource.com/blog/5-clean-code-tips-for-reducing-cognitive-complexity/)

**Recommended Thresholds**
- General rule: aim for scores below 15
- SonarQube default maximum complexity: 15
- Method Cognitive Complexity greater than 20 commonly used as quality gate
- Reference: [Medium - Cognitive Complexity by SonarQube](https://medium.com/@himanshuganglani/clean-code-cognitive-complexity-by-sonarqube-659d49a6837d)

**Calculation Method**
- Counts if/else conditions, nested loops (for, forEach, do/while)
- Includes try/catch blocks and switch statements
- Mixed operators in conditions increase complexity
- Reference: [SonarQube Documentation - Metrics Definition](https://docs.sonarsource.com/sonarqube-server/10.8/user-guide/code-metrics/metrics-definition)

### Academic Research on Software Maintainability

**Tool-Based Perspective on Software Code Maintainability Metrics** (2020)
- Authors: Ardito et al.
- Published in: Scientific Programming (Wiley Online Library)
- Systematic Literature Review on maintainability metrics
- Reference: [Wiley - Software Code Maintainability Metrics](https://onlinelibrary.wiley.com/doi/10.1155/2020/8840389)

**Code Reviews and Complexity** (2024)
- Paper: "The utility of complexity metrics during code reviews for CSE software projects"
- Published in: ScienceDirect
- Analyzes metrics gathered via GitHub Actions for pull requests
- Techniques to guide code review considering cyclomatic complexity levels
- Reference: [ScienceDirect - Complexity Metrics](https://www.sciencedirect.com/science/article/abs/pii/S0167739X2400270X)

---

## 10. Additional Authoritative Sources

### Code Smells and Refactoring

**Book: Refactoring: Improving the Design of Existing Code** (1999, 2nd Edition 2018)
- Author: Martin Fowler
- Publisher: Addison-Wesley
- ISBN (1st Ed): 978-0201485677
- ISBN (2nd Ed): 978-0134757599
- Term "code smell" first coined by Kent Beck
- Featured in the 1999 Refactoring book
- Reference: [Martin Fowler - Code Smell](https://martinfowler.com/bliki/CodeSmell.html)

**Code Smell Definition**
- "Certain structures in the code that indicate violation of fundamental design principles"
- "Surface indication that usually corresponds to a deeper problem in the system"
- Heuristics to indicate when to refactor
- Reference: [Wikipedia - Code Smell](https://en.wikipedia.org/wiki/Code_smell)

**Duplication as Major Code Smell**
- Duplication is one of the biggest code smells
- Spotting duplicate code and removing it leads to improved design
- Reference: [Coding Horror - Code Smells](https://blog.codinghorror.com/code-smells/)

### Domain-Driven Design

**Book: Domain-Driven Design: Tackling Complexity in the Heart of Software** (2003)
- Author: Eric Evans
- Publisher: Addison-Wesley Professional
- ISBN: 978-0321125217
- Available at: [Amazon](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)

**DDD Reference Document**
- Official Domain-Driven Design Reference by Eric Evans
- PDF: Domain-­Driven Design Reference (2015)
- Reference: [Domain Language - DDD Reference](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf)

**Key DDD Concepts**
- Entities: Defined by their identity
- Value Objects: Defined by their attributes
- Aggregates: Clusters of entities that behave as single unit
- Repositories: Separate domain logic from persistence
- Reference: [Martin Fowler - Domain Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

### Code Complete - Steve McConnell

**Book: Code Complete: A Practical Handbook of Software Construction** (1993, 2nd Edition 2004)
- Author: Steve McConnell
- Publisher: Microsoft Press
- ISBN: 978-0735619678
- Won Jolt Award in 1993
- Best-selling, best-reviewed software development book
- Reference: [Amazon - Code Complete](https://www.amazon.com/Code-Complete-Practical-Handbook-Construction/dp/0735619670)

**Key Topics Covered**
- Naming variables to deciding when to write a subroutine
- Architecture, coding standards, testing, integration
- Software craftsmanship nature
- Main activities: detailed design, construction planning, coding, debugging, testing
- Reference: [Wikipedia - Code Complete](https://en.wikipedia.org/wiki/Code_Complete)

### Architecture Testing Tools

**ArchUnit - Java Architecture Testing**
- Free, simple, and extensible library for checking architecture
- Define rules for architecture using plain Java unit tests
- Out-of-the-box functionality for layered architecture and onion architecture
- Enforce naming conventions, class access, prevention of cycles
- Reference: [ArchUnit Official Site](https://www.archunit.org/)

**ArchUnit Examples**
- Layered Architecture Test examples on GitHub
- Define layers and add constraints for each layer
- Reference: [GitHub - ArchUnit Examples](https://github.com/TNG/ArchUnit-Examples/blob/main/example-plain/src/test/java/com/tngtech/archunit/exampletest/LayeredArchitectureTest.java)

**NetArchTest - .NET Alternative**
- Inspired by ArchUnit for Java
- Enforce architecture conventions in .NET codebases
- Can be used with any unit test framework
- Reference: [GitHub - NetArchTest](https://github.com/BenMorris/NetArchTest)

**InfoQ Article on ArchUnit**
- "ArchUnit Verifies Architecture Rules for Java Applications"
- Professional coverage of architecture verification
- Reference: [InfoQ - ArchUnit](https://www.infoq.com/news/2022/10/archunit/)

---

## Conclusion

The code quality detection rules implemented in Guardian are firmly grounded in:

1. **Academic Research**: Peer-reviewed papers on software maintainability, complexity metrics, and code quality
2. **Industry Standards**: ISO/IEC 25010, SonarQube rules, Google and Airbnb style guides
3. **Authoritative Books**:
   - Robert C. Martin's "Clean Architecture" (2017)
   - Eric Evans' "Domain-Driven Design" (2003)
   - Martin Fowler's "Patterns of Enterprise Application Architecture" (2002)
   - Martin Fowler's "Refactoring" (1999, 2018)
   - Steve McConnell's "Code Complete" (1993, 2004)
4. **Expert Guidance**: Martin Fowler, Robert C. Martin (Uncle Bob), Eric Evans, Alistair Cockburn, Kent Beck
5. **Open Source Tools**: ArchUnit, SonarQube, ESLint - widely adopted in enterprise environments

These rules represent decades of software engineering wisdom, empirical research, and battle-tested practices from the world's leading software organizations and thought leaders.

---

## Additional Resources

### Online Catalogs and References

- Martin Fowler's Enterprise Application Architecture Catalog: https://martinfowler.com/eaaCatalog/
- Martin Fowler's Bliki (Blog + Wiki): https://martinfowler.com/bliki/
- Robert C. Martin's Principles Collection: http://principles-wiki.net/collections:robert_c._martin_s_principle_collection
- Domain Language (Eric Evans): https://www.domainlanguage.com/

### GitHub Repositories

- Airbnb JavaScript Style Guide: https://github.com/airbnb/javascript
- Google Style Guides: https://google.github.io/styleguide/
- Domain-Driven Hexagon: https://github.com/Sairyss/domain-driven-hexagon
- ArchUnit Examples: https://github.com/TNG/ArchUnit-Examples

### Educational Institutions

- MIT Course 6.031: Software Construction: https://web.mit.edu/6.031/www/
- Cornell CS Java Style Guide: https://www.cs.cornell.edu/courses/JavaAndDS/JavaStyle.html

---

**Document Version**: 1.0
**Last Updated**: 2025-11-24
**Questions or want to contribute research?**
- 📧 Email: fozilbek.samiyev@gmail.com
- 🐙 GitHub: https://github.com/samiyev/puaros/issues
**Based on research as of**: November 2025
