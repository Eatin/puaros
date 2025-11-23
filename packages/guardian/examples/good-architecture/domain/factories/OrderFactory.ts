import { Order } from "../aggregates/Order"
import { OrderId } from "../value-objects/OrderId"
import { UserId } from "../value-objects/UserId"
import { OrderStatus } from "../value-objects/OrderStatus"
import { OrderItem } from "../entities/OrderItem"
import { Money } from "../value-objects/Money"

/**
 * Factory: OrderFactory
 *
 * DDD Pattern: Factory
 * - Handles complex Order creation
 * - Different creation scenarios
 * - Validation and defaults
 *
 * Clean Code:
 * - Each method has clear purpose
 * - No magic values
 * - Meaningful names
 */
export class OrderFactory {
    /**
     * Create empty order for user
     */
    public static createEmptyOrder(userId: UserId): Order {
        return Order.create(userId)
    }

    /**
     * Create order with initial items
     */
    public static createWithItems(
        userId: UserId,
        items: Array<{ productId: string; productName: string; price: Money; quantity: number }>,
    ): Order {
        const order = Order.create(userId)

        for (const item of items) {
            order.addItem(item.productId, item.productName, item.price, item.quantity)
        }

        return order
    }

    /**
     * Reconstitute order from persistence
     */
    public static reconstitute(data: {
        orderId: string
        userId: string
        items: Array<{
            id: string
            productId: string
            productName: string
            price: number
            currency: string
            quantity: number
        }>
        status: string
        createdAt: Date
        confirmedAt?: Date
        deliveredAt?: Date
    }): Order {
        const orderId = OrderId.create(data.orderId)
        const userId = UserId.create(data.userId)
        const status = OrderStatus.create(data.status)

        const items = data.items.map((item) =>
            OrderItem.reconstitute(
                item.productId,
                item.productName,
                Money.create(item.price, item.currency),
                item.quantity,
                item.id,
            ),
        )

        return Order.reconstitute(
            orderId,
            userId,
            items,
            status,
            data.createdAt,
            data.confirmedAt,
            data.deliveredAt,
        )
    }

    /**
     * Create test order
     */
    public static createTestOrder(userId?: UserId): Order {
        const testUserId = userId ?? UserId.create()
        const order = Order.create(testUserId)

        order.addItem("test-product-1", "Test Product 1", Money.create(10, "USD"), 2)

        order.addItem("test-product-2", "Test Product 2", Money.create(20, "USD"), 1)

        return order
    }
}
