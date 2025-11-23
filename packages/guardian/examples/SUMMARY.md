# Guardian Examples - Summary

This document summarizes the examples created for testing Guardian's detection capabilities.

## 📁 Structure Overview

```
examples/
├── README.md                        # Main documentation
├── SUMMARY.md                       # This file
├── good-architecture/               # ✅ Best practices (29 files)
│   ├── domain/                      # Domain layer (18 files)
│   │   ├── aggregates/              # User, Order aggregate roots
│   │   ├── entities/                # OrderItem entity
│   │   ├── value-objects/           # Email, Money, UserId, OrderId, OrderStatus
│   │   ├── events/                  # UserCreatedEvent
│   │   ├── services/                # UserRegistrationService, PricingService
│   │   ├── factories/               # UserFactory, OrderFactory
│   │   ├── specifications/          # Specification pattern, business rules
│   │   └── repositories/            # IUserRepository, IOrderRepository interfaces
│   ├── application/                 # Application layer (7 files)
│   │   ├── use-cases/               # CreateUser, PlaceOrder
│   │   ├── dtos/                    # UserResponseDto, OrderResponseDto, CreateUserRequest
│   │   └── mappers/                 # UserMapper, OrderMapper
│   └── infrastructure/              # Infrastructure layer (4 files)
│       ├── repositories/            # InMemoryUserRepository, InMemoryOrderRepository
│       └── controllers/             # UserController, OrderController
│
└── bad-architecture/                # ❌ Anti-patterns (7 files)
    ├── hardcoded/                   # Magic numbers and strings
    ├── circular/                    # Circular dependencies
    ├── framework-leaks/             # Framework in domain layer
    ├── entity-exposure/             # Domain entities in controllers
    └── naming/                      # Wrong naming conventions
```

## ✅ Good Architecture Examples (29 files)

### Domain Layer - DDD Patterns

#### 1. **Aggregates** (2 files)
- **User.ts** - User aggregate root with:
  - Business operations: activate, deactivate, block, unblock, recordLogin
  - Invariants validation
  - Domain events (UserCreatedEvent)
  - Factory methods: create(), reconstitute()

- **Order.ts** - Order aggregate with complex logic:
  - Manages OrderItem entities
  - Order lifecycle (confirm, pay, ship, deliver, cancel)
  - Status transitions with validation
  - Business rules enforcement
  - Total calculation

#### 2. **Value Objects** (5 files)
- **Email.ts** - Self-validating email with regex, domain extraction
- **Money.ts** - Money with currency, arithmetic operations, prevents currency mixing
- **UserId.ts** - Strongly typed ID (UUID-based)
- **OrderId.ts** - Strongly typed Order ID
- **OrderStatus.ts** - Type-safe enum with valid transitions

#### 3. **Entities** (1 file)
- **OrderItem.ts** - Entity with identity, part of Order aggregate

#### 4. **Domain Events** (1 file)
- **UserCreatedEvent.ts** - Immutable domain event

#### 5. **Domain Services** (2 files)
- **UserRegistrationService.ts** - Checks email uniqueness, coordinates user creation
- **PricingService.ts** - Calculates discounts, shipping, tax

#### 6. **Factories** (2 files)
- **UserFactory.ts** - Creates users from OAuth, legacy data, test users
- **OrderFactory.ts** - Creates orders with various scenarios

#### 7. **Specifications** (3 files)
- **Specification.ts** - Base class with AND, OR, NOT combinators
- **EmailSpecification.ts** - Corporate email, blacklist rules
- **OrderSpecification.ts** - Discount eligibility, cancellation rules

#### 8. **Repository Interfaces** (2 files)
- **IUserRepository.ts** - User persistence abstraction
- **IOrderRepository.ts** - Order persistence abstraction

### Application Layer

#### 9. **Use Cases** (2 files)
- **CreateUser.ts** - Orchestrates user registration
- **PlaceOrder.ts** - Orchestrates order placement

#### 10. **DTOs** (3 files)
- **UserResponseDto.ts** - API response format
- **CreateUserRequest.ts** - API request format
- **OrderResponseDto.ts** - Order with items response

#### 11. **Mappers** (2 files)
- **UserMapper.ts** - Domain ↔ DTO conversion
- **OrderMapper.ts** - Domain ↔ DTO conversion

### Infrastructure Layer

#### 12. **Repositories** (2 files)
- **InMemoryUserRepository.ts** - User repository implementation
- **InMemoryOrderRepository.ts** - Order repository implementation

#### 13. **Controllers** (2 files)
- **UserController.ts** - HTTP endpoints, returns DTOs
- **OrderController.ts** - HTTP endpoints, delegates to use cases

## ❌ Bad Architecture Examples (7 files)

### 1. **Hardcoded Values** (1 file)
- **ServerWithMagicNumbers.ts**
  - Magic numbers: 3000 (port), 5000 (timeout), 3 (retries), 100, 200, 60
  - Magic strings: "http://localhost:8080", "mongodb://localhost:27017/mydb"

### 2. **Circular Dependencies** (2 files)
- **UserService.ts** → **OrderService.ts** → **UserService.ts**
  - Creates circular import cycle
  - Causes tight coupling
  - Makes testing difficult

### 3. **Framework Leaks** (1 file)
- **UserEntity.ts**
  - Imports PrismaClient in domain layer
  - Violates Dependency Inversion
  - Couples domain to infrastructure

### 4. **Entity Exposure** (1 file)
- **BadUserController.ts**
  - Returns domain entity directly (User)
  - Exposes internal structure (passwordHash, etc.)
  - No DTO layer

### 5. **Naming Conventions** (2 files)
- **user.ts** - lowercase file name (should be User.ts)
- **UserDto.ts** - DTO in domain layer (should be in application)

## 🧪 Guardian Test Results

### Test 1: Good Architecture
```bash
guardian check examples/good-architecture
```

**Results:**
- ✅ No critical violations
- ⚠️  60 hardcoded values (mostly error messages and enum values - acceptable for examples)
- ⚠️  1 false positive: "PlaceOrder" verb not recognized (FIXED: added "Place" to allowed verbs)

**Metrics:**
- Files analyzed: 29
- Total functions: 12
- Total imports: 73
- Layer distribution:
  - domain: 18 files
  - application: 7 files
  - infrastructure: 4 files

### Test 2: Bad Architecture
```bash
guardian check examples/bad-architecture
```

**Results:**
- ✅ Detected 9 hardcoded values in ServerWithMagicNumbers.ts
- ⚠️  Circular dependencies not detected (needs investigation)

**Detected Issues:**
1. Magic number: 3 (maxRetries)
2. Magic number: 200 (burstLimit)
3. Magic string: "mongodb://localhost:27017/mydb"
4. Magic string: "http://localhost:8080"
5. Magic string: "user@example.com"
6. Magic string: "hashed_password_exposed!"

## 📊 Patterns Demonstrated

### DDD (Domain-Driven Design)
- ✅ Aggregates: User, Order
- ✅ Entities: OrderItem
- ✅ Value Objects: Email, Money, UserId, OrderId, OrderStatus
- ✅ Domain Services: UserRegistrationService, PricingService
- ✅ Domain Events: UserCreatedEvent
- ✅ Factories: UserFactory, OrderFactory
- ✅ Specifications: Email rules, Order rules
- ✅ Repository Interfaces: IUserRepository, IOrderRepository

### SOLID Principles
- ✅ **SRP**: Each class has one responsibility
- ✅ **OCP**: Extensible through inheritance, not modification
- ✅ **LSP**: Specifications, repositories are substitutable
- ✅ **ISP**: Small, focused interfaces
- ✅ **DIP**: Domain depends on abstractions, infrastructure implements them

### Clean Architecture
- ✅ **Dependency Rule**: Domain → Application → Infrastructure
- ✅ **Boundaries**: Clear separation between layers
- ✅ **DTOs**: Application layer isolates domain from external world
- ✅ **Use Cases**: Application services orchestrate domain logic

### Clean Code Principles
- ✅ **Meaningful Names**: Email, Money, Order (not E, M, O)
- ✅ **Small Functions**: Each method does one thing
- ✅ **No Magic Values**: Named constants (MAX_RETRIES, DEFAULT_PORT)
- ✅ **DRY**: No repeated code
- ✅ **KISS**: Simple, straightforward implementations
- ✅ **YAGNI**: Only what's needed, no over-engineering

## 🎯 Key Learnings

### What Guardian Detects Well ✅
1. **Hardcoded values** - Magic numbers and strings
2. **Naming conventions** - Layer-specific patterns
3. **Layer distribution** - Clean architecture structure
4. **Project metrics** - Files, functions, imports

### What Needs Improvement ⚠️
1. **Circular dependencies** - Detection needs investigation
2. **Framework leaks** - Feature not yet implemented (v0.4.0)
3. **Entity exposure** - Feature not yet implemented (v0.4.0)
4. **False positives** - Some verbs missing from allowed list (fixed)

### What's Next (Roadmap) 🚀
1. **v0.4.0**: Framework leaks detection, Entity exposure detection
2. **v0.5.0**: Repository pattern enforcement, Dependency injection checks
3. **v0.6.0**: Over-engineering detection, Primitive obsession
4. **v0.7.0**: Configuration file support
5. **v0.8.0**: Multiple output formats (JSON, HTML, SARIF)

## 💡 How to Use These Examples

### For Learning
- Study `good-architecture/` to understand DDD and Clean Architecture
- Compare with `bad-architecture/` to see anti-patterns
- Read comments explaining WHY patterns are good or bad

### For Testing Guardian
```bash
# Test on good examples (should have minimal violations)
pnpm guardian check examples/good-architecture

# Test on bad examples (should detect violations)
pnpm guardian check examples/bad-architecture

# Test specific anti-pattern
pnpm guardian check examples/bad-architecture/hardcoded
```

### For Development
- Use good examples as templates for new features
- Add new anti-patterns to bad examples
- Test Guardian improvements against these examples

### For CI/CD
- Run Guardian on examples in CI to prevent regressions
- Ensure new Guardian versions still detect known violations

## 📝 Statistics

### Good Architecture
- **Total files**: 29
- **Domain layer**: 18 files (62%)
- **Application layer**: 7 files (24%)
- **Infrastructure layer**: 4 files (14%)

**Pattern distribution:**
- Aggregates: 2
- Value Objects: 5
- Entities: 1
- Domain Events: 1
- Domain Services: 2
- Factories: 2
- Specifications: 3
- Repositories: 2
- Use Cases: 2
- DTOs: 3
- Mappers: 2
- Controllers: 2

### Bad Architecture
- **Total files**: 7
- **Anti-patterns**: 5 categories
- **Violations detected**: 9 hardcoded values

## 🎓 Educational Value

These examples serve as:
1. **Learning material** - For understanding Clean Architecture + DDD
2. **Testing framework** - For Guardian development
3. **Documentation** - Living examples of best practices
4. **Templates** - Starting point for new projects
5. **Reference** - Quick lookup for patterns

## 🔧 Maintenance

### Adding New Examples
1. Add to appropriate directory (`good-architecture` or `bad-architecture`)
2. Follow naming conventions
3. Add detailed comments explaining patterns
4. Test with Guardian
5. Update this summary

### Testing Changes
1. Run `pnpm build` in guardian package
2. Test on both good and bad examples
3. Verify detection accuracy
4. Update SUMMARY.md with findings

---

**Last Updated**: 2025-11-24

**Guardian Version**: 0.2.0 (preparing 0.3.0)

**Examples Count**: 36 files (29 good + 7 bad)