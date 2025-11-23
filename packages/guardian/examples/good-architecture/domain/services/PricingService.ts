import { Order } from "../aggregates/Order"
import { Money } from "../value-objects/Money"

/**
 * Domain Service: PricingService
 *
 * DDD Pattern: Domain Service
 * - Encapsulates pricing business logic
 * - Pure business logic (no infrastructure)
 * - Can be used by multiple aggregates
 *
 * Business Rules:
 * - Discounts based on order total
 * - Free shipping threshold
 * - Tax calculation
 *
 * Clean Code:
 * - No magic numbers: constants for thresholds
 * - Clear method names
 * - Single Responsibility
 */
export class PricingService {
    private static readonly DISCOUNT_THRESHOLD = Money.create(100, "USD")
    private static readonly DISCOUNT_PERCENTAGE = 0.1
    private static readonly FREE_SHIPPING_THRESHOLD = Money.create(50, "USD")
    private static readonly SHIPPING_COST = Money.create(10, "USD")
    private static readonly TAX_RATE = 0.2

    /**
     * Calculate discount for order
     *
     * Business Rule: 10% discount for orders over $100
     */
    public calculateDiscount(order: Order): Money {
        const total = order.calculateTotal()

        if (total.isGreaterThan(PricingService.DISCOUNT_THRESHOLD)) {
            return total.multiply(PricingService.DISCOUNT_PERCENTAGE)
        }

        return Money.zero(total.currency)
    }

    /**
     * Calculate shipping cost
     *
     * Business Rule: Free shipping for orders over $50
     */
    public calculateShippingCost(order: Order): Money {
        const total = order.calculateTotal()

        if (total.isGreaterThan(PricingService.FREE_SHIPPING_THRESHOLD)) {
            return Money.zero(total.currency)
        }

        return PricingService.SHIPPING_COST
    }

    /**
     * Calculate tax
     *
     * Business Rule: 20% tax on order total
     */
    public calculateTax(order: Order): Money {
        const total = order.calculateTotal()
        return total.multiply(PricingService.TAX_RATE)
    }

    /**
     * Calculate final total with all costs
     */
    public calculateFinalTotal(order: Order): Money {
        const subtotal = order.calculateTotal()
        const discount = this.calculateDiscount(order)
        const shipping = this.calculateShippingCost(order)
        const tax = this.calculateTax(order)

        return subtotal.subtract(discount).add(shipping).add(tax)
    }
}
