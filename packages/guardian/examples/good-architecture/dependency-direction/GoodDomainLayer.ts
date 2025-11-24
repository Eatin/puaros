/**
 * ✅ GOOD: Domain layer with correct dependencies
 *
 * Domain should only import from:
 * - Other domain files
 * - Shared utilities
 *
 * Domain should NOT import from:
 * - Application layer
 * - Infrastructure layer
 */

import { Email } from "../domain/value-objects/Email"
import { UserId } from "../domain/value-objects/UserId"
import { Result } from "../../../src/shared/types/Result"

/**
 * ✅ Domain entity using only domain value objects and shared types
 */
export class User {
    private readonly id: UserId
    private email: Email
    private readonly createdAt: Date

    constructor(id: UserId, email: Email, createdAt: Date = new Date()) {
        this.id = id
        this.email = email
        this.createdAt = createdAt
    }

    public getId(): UserId {
        return this.id
    }

    public getEmail(): Email {
        return this.email
    }

    public changeEmail(newEmail: Email): Result<void> {
        if (this.email.equals(newEmail)) {
            return Result.fail("Email is the same")
        }

        this.email = newEmail
        return Result.ok()
    }
}

/**
 * ✅ Domain repository interface (not importing from infrastructure)
 */
export interface IUserRepository {
    findById(id: UserId): Promise<User | null>
    save(user: User): Promise<void>
    delete(id: UserId): Promise<void>
}
