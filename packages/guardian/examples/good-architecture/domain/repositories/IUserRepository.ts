import { User } from "../aggregates/User"
import { UserId } from "../value-objects/UserId"
import { Email } from "../value-objects/Email"

/**
 * User Repository Interface
 *
 * DDD Pattern: Repository
 * - Interface in domain layer
 * - Implementation in infrastructure layer
 * - Collection-like API for aggregates
 *
 * SOLID Principles:
 * - DIP: domain depends on abstraction
 * - ISP: focused interface
 * - SRP: manages User persistence
 *
 * Clean Architecture:
 * - Domain doesn't know about DB
 * - Infrastructure implements this
 */
export interface IUserRepository {
    /**
     * Save user (create or update)
     */
    save(user: User): Promise<void>

    /**
     * Find user by ID
     */
    findById(id: UserId): Promise<User | null>

    /**
     * Find user by email
     */
    findByEmail(email: Email): Promise<User | null>

    /**
     * Find all users
     */
    findAll(): Promise<User[]>

    /**
     * Find active users
     */
    findActive(): Promise<User[]>

    /**
     * Delete user
     */
    delete(id: UserId): Promise<void>

    /**
     * Check if user exists
     */
    exists(id: UserId): Promise<boolean>
}
