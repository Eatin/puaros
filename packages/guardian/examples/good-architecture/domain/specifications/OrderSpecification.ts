import { Specification } from "./Specification"
import { Order } from "../aggregates/Order"
import { Money } from "../value-objects/Money"

/**
 * Order Can Be Cancelled Specification
 *
 * Business Rule: Order can be cancelled if not delivered
 */
export class OrderCanBeCancelledSpecification extends Specification<Order> {
    public isSatisfiedBy(order: Order): boolean {
        return !order.status.isDelivered()
    }
}

/**
 * Order Eligible For Discount Specification
 *
 * Business Rule: Orders over $100 get discount
 */
export class OrderEligibleForDiscountSpecification extends Specification<Order> {
    private static readonly DISCOUNT_THRESHOLD = Money.create(100, "USD")

    public isSatisfiedBy(order: Order): boolean {
        const total = order.calculateTotal()
        return total.isGreaterThan(OrderEligibleForDiscountSpecification.DISCOUNT_THRESHOLD)
    }
}

/**
 * Order Eligible For Free Shipping Specification
 *
 * Business Rule: Orders over $50 get free shipping
 */
export class OrderEligibleForFreeShippingSpecification extends Specification<Order> {
    private static readonly FREE_SHIPPING_THRESHOLD = Money.create(50, "USD")

    public isSatisfiedBy(order: Order): boolean {
        const total = order.calculateTotal()
        return total.isGreaterThan(
            OrderEligibleForFreeShippingSpecification.FREE_SHIPPING_THRESHOLD,
        )
    }
}

/**
 * High Value Order Specification
 *
 * Business Rule: Orders over $500 are high value
 * (might need special handling, insurance, etc.)
 */
export class HighValueOrderSpecification extends Specification<Order> {
    private static readonly HIGH_VALUE_THRESHOLD = Money.create(500, "USD")

    public isSatisfiedBy(order: Order): boolean {
        const total = order.calculateTotal()
        return total.isGreaterThan(HighValueOrderSpecification.HIGH_VALUE_THRESHOLD)
    }
}

/**
 * Composed Specification: Premium Order
 *
 * Premium = High Value AND Eligible for Discount
 */
export class PremiumOrderSpecification extends Specification<Order> {
    private readonly spec: Specification<Order>

    constructor() {
        super()
        this.spec = new HighValueOrderSpecification().and(
            new OrderEligibleForDiscountSpecification(),
        )
    }

    public isSatisfiedBy(order: Order): boolean {
        return this.spec.isSatisfiedBy(order)
    }
}
