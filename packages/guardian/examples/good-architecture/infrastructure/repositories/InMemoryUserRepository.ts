import { IUserRepository } from "../../domain/repositories/IUserRepository"
import { User } from "../../domain/aggregates/User"
import { UserId } from "../../domain/value-objects/UserId"
import { Email } from "../../domain/value-objects/Email"

/**
 * In-Memory User Repository
 *
 * DDD Pattern: Repository Implementation
 * - Implements domain interface
 * - Infrastructure concern
 * - Can be replaced with real DB
 *
 * SOLID Principles:
 * - DIP: implements abstraction from domain
 * - SRP: manages User persistence
 * - LSP: substitutable with other implementations
 *
 * Clean Architecture:
 * - Infrastructure layer
 * - Depends on domain
 * - Can be swapped (in-memory, Postgres, MongoDB)
 *
 * Use cases:
 * - Testing
 * - Development
 * - Prototyping
 */
export class InMemoryUserRepository implements IUserRepository {
    private readonly users: Map<string, User> = new Map()

    public async save(user: User): Promise<void> {
        this.users.set(user.userId.value, user)
    }

    public async findById(id: UserId): Promise<User | null> {
        return this.users.get(id.value) ?? null
    }

    public async findByEmail(email: Email): Promise<User | null> {
        return Array.from(this.users.values()).find((user) => user.email.equals(email)) ?? null
    }

    public async findAll(): Promise<User[]> {
        return Array.from(this.users.values())
    }

    public async findActive(): Promise<User[]> {
        return Array.from(this.users.values()).filter((user) => user.isActive)
    }

    public async delete(id: UserId): Promise<void> {
        this.users.delete(id.value)
    }

    public async exists(id: UserId): Promise<boolean> {
        return this.users.has(id.value)
    }

    public clear(): void {
        this.users.clear()
    }
}
