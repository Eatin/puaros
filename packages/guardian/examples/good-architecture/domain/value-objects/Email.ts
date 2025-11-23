import { ValueObject } from "../../../../src/domain/value-objects/ValueObject"

interface EmailProps {
    readonly value: string
}

/**
 * Email Value Object
 *
 * DDD Pattern: Value Object
 * - Immutable
 * - Self-validating
 * - No identity
 * - Equality by value
 *
 * Clean Code:
 * - Single Responsibility: represents email
 * - Meaningful name: clearly email
 * - No magic values: validation rules as constants
 */
export class Email extends ValueObject<EmailProps> {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    private static readonly MAX_LENGTH = 255

    private constructor(props: EmailProps) {
        super(props)
    }

    public static create(email: string): Email {
        const trimmed = email.trim().toLowerCase()

        if (!trimmed) {
            throw new Error("Email cannot be empty")
        }

        if (trimmed.length > Email.MAX_LENGTH) {
            throw new Error(`Email must be less than ${Email.MAX_LENGTH} characters`)
        }

        if (!Email.EMAIL_REGEX.test(trimmed)) {
            throw new Error(`Invalid email format: ${email}`)
        }

        return new Email({ value: trimmed })
    }

    public get value(): string {
        return this.props.value
    }

    public getDomain(): string {
        return this.props.value.split("@")[1]
    }

    public isFromDomain(domain: string): boolean {
        return this.getDomain() === domain.toLowerCase()
    }

    public toString(): string {
        return this.props.value
    }
}
