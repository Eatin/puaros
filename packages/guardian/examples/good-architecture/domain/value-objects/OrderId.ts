import { ValueObject } from "../../../../src/domain/value-objects/ValueObject"
import { v4 as uuidv4, validate as uuidValidate } from "uuid"

interface OrderIdProps {
    readonly value: string
}

/**
 * OrderId Value Object
 *
 * Type safety: cannot mix with UserId
 */
export class OrderId extends ValueObject<OrderIdProps> {
    private constructor(props: OrderIdProps) {
        super(props)
    }

    public static create(id?: string): OrderId {
        const value = id ?? uuidv4()

        if (!uuidValidate(value)) {
            throw new Error(`Invalid OrderId format: ${value}`)
        }

        return new OrderId({ value })
    }

    public get value(): string {
        return this.props.value
    }

    public toString(): string {
        return this.props.value
    }
}
