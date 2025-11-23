import { BaseEntity } from "../../../../src/domain/entities/BaseEntity"
import { Email } from "../value-objects/Email"
import { UserId } from "../value-objects/UserId"
import { UserCreatedEvent } from "../events/UserCreatedEvent"

/**
 * User Aggregate Root
 *
 * DDD Patterns:
 * - Aggregate Root: consistency boundary
 * - Rich Domain Model: contains business logic
 * - Domain Events: publishes UserCreatedEvent
 *
 * SOLID Principles:
 * - SRP: manages user identity and state
 * - OCP: extensible through events
 * - DIP: depends on abstractions (Email, UserId)
 *
 * Business Rules (Invariants):
 * - Email must be unique (enforced by repository)
 * - User must have valid email
 * - Blocked users cannot be activated directly
 * - Only active users can be blocked
 */
export class User extends BaseEntity {
    private readonly _userId: UserId
    private readonly _email: Email
    private readonly _firstName: string
    private readonly _lastName: string
    private _isActive: boolean
    private _isBlocked: boolean
    private readonly _registeredAt: Date
    private _lastLoginAt?: Date

    private constructor(
        userId: UserId,
        email: Email,
        firstName: string,
        lastName: string,
        isActive: boolean,
        isBlocked: boolean,
        registeredAt: Date,
        lastLoginAt?: Date,
    ) {
        super(userId.value)
        this._userId = userId
        this._email = email
        this._firstName = firstName
        this._lastName = lastName
        this._isActive = isActive
        this._isBlocked = isBlocked
        this._registeredAt = registeredAt
        this._lastLoginAt = lastLoginAt

        this.validateInvariants()
    }

    /**
     * Factory method: Create new user (business operation)
     *
     * DDD: Named constructor that represents business intent
     * Clean Code: Intention-revealing method name
     */
    public static create(email: Email, firstName: string, lastName: string): User {
        const userId = UserId.create()
        const now = new Date()

        const user = new User(userId, email, firstName, lastName, true, false, now)

        user.addDomainEvent(
            new UserCreatedEvent({
                userId: userId.value,
                email: email.value,
                registeredAt: now,
            }),
        )

        return user
    }

    /**
     * Factory method: Reconstitute from persistence
     *
     * DDD: Separate creation from reconstitution
     * No events raised - already happened
     */
    public static reconstitute(
        userId: UserId,
        email: Email,
        firstName: string,
        lastName: string,
        isActive: boolean,
        isBlocked: boolean,
        registeredAt: Date,
        lastLoginAt?: Date,
    ): User {
        return new User(
            userId,
            email,
            firstName,
            lastName,
            isActive,
            isBlocked,
            registeredAt,
            lastLoginAt,
        )
    }

    /**
     * Business Operation: Activate user
     *
     * DDD: Business logic in domain
     * SOLID SRP: User manages its own state
     */
    public activate(): void {
        if (this._isBlocked) {
            throw new Error("Cannot activate blocked user. Unblock first.")
        }

        if (this._isActive) {
            return
        }

        this._isActive = true
        this.touch()
    }

    /**
     * Business Operation: Deactivate user
     */
    public deactivate(): void {
        if (!this._isActive) {
            return
        }

        this._isActive = false
        this.touch()
    }

    /**
     * Business Operation: Block user
     *
     * Business Rule: Only active users can be blocked
     */
    public block(reason: string): void {
        if (!this._isActive) {
            throw new Error("Cannot block inactive user")
        }

        if (this._isBlocked) {
            return
        }

        this._isBlocked = true
        this._isActive = false
        this.touch()
    }

    /**
     * Business Operation: Unblock user
     */
    public unblock(): void {
        if (!this._isBlocked) {
            return
        }

        this._isBlocked = false
        this.touch()
    }

    /**
     * Business Operation: Record login
     */
    public recordLogin(): void {
        if (!this._isActive) {
            throw new Error("Inactive user cannot login")
        }

        if (this._isBlocked) {
            throw new Error("Blocked user cannot login")
        }

        this._lastLoginAt = new Date()
        this.touch()
    }

    /**
     * Business Query: Check if user can login
     */
    public canLogin(): boolean {
        return this._isActive && !this._isBlocked
    }

    /**
     * Getters: Read-only access to state
     */
    public get userId(): UserId {
        return this._userId
    }

    public get email(): Email {
        return this._email
    }

    public get firstName(): string {
        return this._firstName
    }

    public get lastName(): string {
        return this._lastName
    }

    public get fullName(): string {
        return `${this._firstName} ${this._lastName}`
    }

    public get isActive(): boolean {
        return this._isActive
    }

    public get isBlocked(): boolean {
        return this._isBlocked
    }

    public get registeredAt(): Date {
        return this._registeredAt
    }

    public get lastLoginAt(): Date | undefined {
        return this._lastLoginAt
    }

    /**
     * Invariant validation
     *
     * DDD: Enforce business rules
     */
    private validateInvariants(): void {
        if (!this._firstName?.trim()) {
            throw new Error("First name is required")
        }

        if (!this._lastName?.trim()) {
            throw new Error("Last name is required")
        }

        if (this._isBlocked && this._isActive) {
            throw new Error("Blocked user cannot be active")
        }
    }
}
