/**
 * ✅ GOOD EXAMPLE: Domain language in repository
 *
 * Repository interface uses domain-driven method names that reflect business operations.
 * Method names are self-documenting and align with ubiquitous language.
 */

interface IUserRepository {
    findById(id: UserId): Promise<User | null>

    findByEmail(email: Email): Promise<User | null>

    findActiveUsers(): Promise<User[]>

    save(user: User): Promise<void>

    delete(id: UserId): Promise<void>

    search(criteria: UserSearchCriteria): Promise<User[]>

    countActiveUsers(): Promise<number>

    existsByEmail(email: Email): Promise<boolean>
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
        public readonly department?: string,
    ) {}
}

class User {
    constructor(
        private readonly id: UserId,
        private email: Email,
        private name: string,
        private isActive: boolean,
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

    isUserActive(): boolean {
        return this.isActive
    }

    activate(): void {
        this.isActive = true
    }

    deactivate(): void {
        this.isActive = false
    }
}
