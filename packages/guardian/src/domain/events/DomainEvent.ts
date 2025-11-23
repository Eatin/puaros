import { v4 as uuidv4 } from "uuid"

/**
 * Base interface for all domain events
 */
export interface IDomainEvent {
    readonly eventId: string
    readonly occurredOn: Date
    readonly eventType: string
}

/**
 * Base class for domain events
 */
export abstract class DomainEvent implements IDomainEvent {
    public readonly eventId: string
    public readonly occurredOn: Date
    public readonly eventType: string

    constructor(eventType: string) {
        this.eventId = uuidv4()
        this.occurredOn = new Date()
        this.eventType = eventType
    }
}
