# Repository Pattern Examples

This directory contains examples demonstrating proper and improper implementations of the Repository Pattern.

## Overview

The Repository Pattern provides an abstraction layer between domain logic and data access. A well-implemented repository:

1. Uses domain types, not ORM-specific types
2. Depends on interfaces, not concrete implementations
3. Uses dependency injection, not direct instantiation
4. Uses domain language, not technical database terms

## Examples

### ❌ Bad Examples

#### 1. ORM Types in Interface
**File:** `bad-orm-types-in-interface.ts`

**Problem:** Repository interface exposes Prisma-specific types (`Prisma.UserWhereInput`, `Prisma.UserCreateInput`). This couples the domain layer to infrastructure concerns.

**Violations:**
- Domain depends on ORM library
- Cannot swap ORM without changing domain
- Breaks Clean Architecture principles

#### 2. Concrete Repository in Use Case
**File:** `bad-concrete-repository-in-use-case.ts`

**Problem:** Use case depends on `PrismaUserRepository` instead of `IUserRepository` interface.

**Violations:**
- Violates Dependency Inversion Principle
- Cannot easily mock for testing
- Tightly coupled to specific implementation

#### 3. Creating Repository with 'new'
**File:** `bad-new-repository.ts`

**Problem:** Use case instantiates repositories with `new UserRepository()` instead of receiving them through constructor.

**Violations:**
- Violates Dependency Injection principle
- Hard to test (cannot mock dependencies)
- Hidden dependencies
- Creates tight coupling

#### 4. Technical Method Names
**File:** `bad-technical-method-names.ts`

**Problem:** Repository methods use database/SQL terminology (`findOne`, `insert`, `query`, `execute`).

**Violations:**
- Uses technical terms instead of domain language
- Exposes implementation details
- Not aligned with ubiquitous language

### ✅ Good Examples

#### 1. Clean Interface
**File:** `good-clean-interface.ts`

**Benefits:**
- Uses only domain types (UserId, Email, User)
- ORM-agnostic interface
- Easy to understand and maintain
- Follows Clean Architecture

```typescript
interface IUserRepository {
    findById(id: UserId): Promise<User | null>
    findByEmail(email: Email): Promise<User | null>
    save(user: User): Promise<void>
    delete(id: UserId): Promise<void>
}
```

#### 2. Interface in Use Case
**File:** `good-interface-in-use-case.ts`

**Benefits:**
- Depends on interface, not concrete class
- Easy to test with mocks
- Can swap implementations
- Follows Dependency Inversion Principle

```typescript
class CreateUser {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(data: CreateUserRequest): Promise<UserResponseDto> {
        // Uses interface, not concrete implementation
    }
}
```

#### 3. Dependency Injection
**File:** `good-dependency-injection.ts`

**Benefits:**
- All dependencies injected through constructor
- Explicit dependencies (no hidden coupling)
- Easy to test with mocks
- Follows SOLID principles

```typescript
class CreateUser {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly emailService: IEmailService
    ) {}
}
```

#### 4. Domain Language
**File:** `good-domain-language.ts`

**Benefits:**
- Methods use business-oriented names
- Self-documenting interface
- Aligns with ubiquitous language
- Hides implementation details

```typescript
interface IUserRepository {
    findById(id: UserId): Promise<User | null>
    findByEmail(email: Email): Promise<User | null>
    findActiveUsers(): Promise<User[]>
    save(user: User): Promise<void>
    search(criteria: UserSearchCriteria): Promise<User[]>
}
```

## Key Principles

### 1. Persistence Ignorance
Domain entities and repositories should not know about how data is persisted.

```typescript
// ❌ Bad: Domain knows about Prisma
interface IUserRepository {
    find(query: Prisma.UserWhereInput): Promise<User>
}

// ✅ Good: Domain uses own types
interface IUserRepository {
    findById(id: UserId): Promise<User | null>
}
```

### 2. Dependency Inversion
High-level modules (use cases) should not depend on low-level modules (repositories). Both should depend on abstractions (interfaces).

```typescript
// ❌ Bad: Use case depends on concrete repository
class CreateUser {
    constructor(private repo: PrismaUserRepository) {}
}

// ✅ Good: Use case depends on interface
class CreateUser {
    constructor(private repo: IUserRepository) {}
}
```

### 3. Dependency Injection
Don't create dependencies inside classes. Inject them through constructor.

```typescript
// ❌ Bad: Creates dependency
class CreateUser {
    execute() {
        const repo = new UserRepository()
    }
}

// ✅ Good: Injects dependency
class CreateUser {
    constructor(private readonly repo: IUserRepository) {}
}
```

### 4. Ubiquitous Language
Use domain language everywhere, including repository methods.

```typescript
// ❌ Bad: Technical terminology
interface IUserRepository {
    findOne(id: string): Promise<User>
    insert(user: User): Promise<void>
}

// ✅ Good: Domain language
interface IUserRepository {
    findById(id: UserId): Promise<User | null>
    save(user: User): Promise<void>
}
```

## Testing with Guardian

Run Guardian to detect Repository Pattern violations:

```bash
guardian check --root ./examples/repository-pattern
```

Guardian will detect:
- ORM types in repository interfaces
- Concrete repository usage in use cases
- Repository instantiation with 'new'
- Technical method names in repositories

## Further Reading

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Repository Pattern - Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
