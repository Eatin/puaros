import { ValueObject } from "../../../../src/domain/value-objects/ValueObject"
import { v4 as uuidv4, validate as uuidValidate } from "uuid"

interface UserIdProps {
    readonly value: string
}

/**
 * UserId Value Object
 *
 * DDD Pattern: Identity Value Object
 * - Strongly typed ID (not just string)
 * - Self-validating
 * - Type safety: can't mix with OrderId
 *
 * Benefits:
 * - No accidental ID mixing: `findUser(orderId)` won't compile
 * - Clear intent in code
 * - Encapsulated validation
 */
export class UserId extends ValueObject<UserIdProps> {
    private constructor(props: UserIdProps) {
        super(props)
    }

    public static create(id?: string): UserId {
        const value = id ?? uuidv4()

        if (!uuidValidate(value)) {
            throw new Error(`Invalid UserId format: ${value}`)
        }

        return new UserId({ value })
    }

    public get value(): string {
        return this.props.value
    }

    public toString(): string {
        return this.props.value
    }
}
