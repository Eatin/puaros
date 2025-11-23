import { ValueObject } from "../../../../src/domain/value-objects/ValueObject"

interface OrderStatusProps {
    readonly value: string
}

/**
 * OrderStatus Value Object
 *
 * DDD Pattern: Enum as Value Object
 * - Type-safe status
 * - Business logic: valid transitions
 * - Self-validating
 */
export class OrderStatus extends ValueObject<OrderStatusProps> {
    public static readonly PENDING = new OrderStatus({ value: "pending" })
    public static readonly CONFIRMED = new OrderStatus({ value: "confirmed" })
    public static readonly PAID = new OrderStatus({ value: "paid" })
    public static readonly SHIPPED = new OrderStatus({ value: "shipped" })
    public static readonly DELIVERED = new OrderStatus({ value: "delivered" })
    public static readonly CANCELLED = new OrderStatus({ value: "cancelled" })

    private static readonly VALID_STATUSES = [
        "pending",
        "confirmed",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
    ]

    private constructor(props: OrderStatusProps) {
        super(props)
    }

    public static create(status: string): OrderStatus {
        const lower = status.toLowerCase()

        if (!OrderStatus.VALID_STATUSES.includes(lower)) {
            throw new Error(
                `Invalid order status: ${status}. Valid: ${OrderStatus.VALID_STATUSES.join(", ")}`,
            )
        }

        return new OrderStatus({ value: lower })
    }

    public get value(): string {
        return this.props.value
    }

    /**
     * Business Rule: Valid status transitions
     */
    public canTransitionTo(newStatus: OrderStatus): boolean {
        const transitions: Record<string, string[]> = {
            pending: ["confirmed", "cancelled"],
            confirmed: ["paid", "cancelled"],
            paid: ["shipped", "cancelled"],
            shipped: ["delivered"],
            delivered: [],
            cancelled: [],
        }

        const allowedTransitions = transitions[this.value] ?? []
        return allowedTransitions.includes(newStatus.value)
    }

    public isPending(): boolean {
        return this.value === "pending"
    }

    public isConfirmed(): boolean {
        return this.value === "confirmed"
    }

    public isCancelled(): boolean {
        return this.value === "cancelled"
    }

    public isDelivered(): boolean {
        return this.value === "delivered"
    }

    public isFinal(): boolean {
        return this.isDelivered() || this.isCancelled()
    }

    public toString(): string {
        return this.props.value
    }
}
