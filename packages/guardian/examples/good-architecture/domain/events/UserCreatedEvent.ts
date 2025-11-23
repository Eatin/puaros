import { DomainEvent } from "../../../../src/domain/events/DomainEvent"

/**
 * Domain Event: UserCreatedEvent
 *
 * DDD Pattern: Domain Events
 * - Represents something that happened in the domain
 * - Immutable
 * - Past tense naming
 *
 * Use cases:
 * - Send welcome email (async)
 * - Create user profile
 * - Log user registration
 * - Analytics tracking
 */
export interface UserCreatedEventPayload {
    readonly userId: string
    readonly email: string
    readonly registeredAt: Date
}

export class UserCreatedEvent extends DomainEvent<UserCreatedEventPayload> {
    constructor(payload: UserCreatedEventPayload) {
        super("user.created", payload)
    }
}
