/**
 * ✅ GOOD EXAMPLE: Clean repository interface
 *
 * Repository interface uses only domain types, keeping it persistence-agnostic.
 * ORM implementation details stay in infrastructure layer.
 */

interface IUserRepository {
    findById(id: UserId): Promise<User | null>

    findByEmail(email: Email): Promise<User | null>

    save(user: User): Promise<void>

    delete(id: UserId): Promise<void>

    findAll(criteria: UserSearchCriteria): Promise<User[]>
}

class UserId {
    constructor(private readonly value: string) {}

    getValue(): string {
        return this.value
    }
}

class Email {
    constructor(private readonly value: string) {}

    getValue(): string {
        return this.value
    }
}

class UserSearchCriteria {
    constructor(
        public readonly isActive?: boolean,
        public readonly registeredAfter?: Date,
    ) {}
}

class User {
    constructor(
        private readonly id: UserId,
        private email: Email,
        private name: string,
    ) {}

    getId(): UserId {
        return this.id
    }

    getEmail(): Email {
        return this.email
    }

    getName(): string {
        return this.name
    }
}
