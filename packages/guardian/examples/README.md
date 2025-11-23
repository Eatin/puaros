# Guardian Examples

This directory contains examples of good and bad code patterns used for testing Guardian's detection capabilities.

## Structure

```
examples/
├── good-architecture/     # ✅ Proper Clean Architecture + DDD patterns
│   ├── domain/
│   │   ├── aggregates/    # Aggregate Roots
│   │   ├── entities/      # Domain Entities
│   │   ├── value-objects/ # Value Objects
│   │   ├── services/      # Domain Services
│   │   ├── factories/     # Domain Factories
│   │   ├── specifications/# Business Rules
│   │   └── repositories/  # Repository Interfaces
│   ├── application/
│   │   ├── use-cases/     # Application Use Cases
│   │   ├── dtos/          # Data Transfer Objects
│   │   └── mappers/       # Domain <-> DTO mappers
│   └── infrastructure/
│       ├── repositories/  # Repository Implementations
│       ├── controllers/   # HTTP Controllers
│       └── services/      # External Services
│
└── bad-architecture/      # ❌ Anti-patterns for testing
    ├── hardcoded/         # Hardcoded values
    ├── circular/          # Circular dependencies
    ├── framework-leaks/   # Framework in domain
    ├── entity-exposure/   # Entities in controllers
    ├── naming/            # Wrong naming conventions
    └── anemic-model/      # Anemic domain models
```

## Patterns Demonstrated

### Domain-Driven Design (DDD)
- **Aggregate Roots**: User, Order
- **Entities**: OrderItem, Address
- **Value Objects**: Email, Money, OrderStatus
- **Domain Services**: UserRegistrationService, PricingService
- **Domain Events**: UserCreatedEvent, OrderPlacedEvent
- **Factories**: UserFactory, OrderFactory
- **Specifications**: EmailSpecification, OrderCanBeCancelledSpecification
- **Repository Interfaces**: IUserRepository, IOrderRepository

### SOLID Principles
- **SRP**: Single Responsibility - each class has one reason to change
- **OCP**: Open/Closed - extend with new classes, not modifications
- **LSP**: Liskov Substitution - derived classes are substitutable
- **ISP**: Interface Segregation - small, focused interfaces
- **DIP**: Dependency Inversion - depend on abstractions

### Clean Architecture
- **Dependency Rule**: Inner layers don't know about outer layers
- **Domain**: Pure business logic, no frameworks
- **Application**: Use cases orchestration
- **Infrastructure**: External concerns (DB, HTTP, etc.)

### Clean Code Principles
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **YAGNI**: You Aren't Gonna Need It
- **Meaningful Names**: Intention-revealing names
- **Small Functions**: Do one thing well
- **No Magic Values**: Named constants

## Testing Guardian

Run Guardian on examples:

```bash
# Test good architecture (should have no violations)
pnpm guardian check examples/good-architecture

# Test bad architecture (should detect violations)
pnpm guardian check examples/bad-architecture

# Test specific anti-pattern
pnpm guardian check examples/bad-architecture/hardcoded
```

## Use Cases

### 1. Development
Use good examples as templates for new features

### 2. Testing
Use bad examples to verify Guardian detects violations

### 3. Documentation
Learn Clean Architecture + DDD patterns by example

### 4. CI/CD
Run Guardian on examples in CI to prevent regressions

---

**Note:** These examples are intentionally simplified for educational purposes. Real-world applications would have more complexity.