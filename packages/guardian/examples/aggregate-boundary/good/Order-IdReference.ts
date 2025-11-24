/**
 * ✅ GOOD EXAMPLE: Reference by ID
 *
 * Best Practice: Order aggregate references other aggregates only by their IDs
 *
 * Benefits:
 * 1. Loose coupling between aggregates
 * 2. Each aggregate can be modified independently
 * 3. Follows DDD aggregate boundary principles
 * 4. Clear separation of concerns
 */

import { UserId } from "../user/value-objects/UserId"
import { ProductId } from "../product/value-objects/ProductId"

export class Order {
    private id: string
    private userId: UserId
    private productId: ProductId
    private quantity: number

    constructor(id: string, userId: UserId, productId: ProductId, quantity: number) {
        this.id = id
        this.userId = userId
        this.productId = productId
        this.quantity = quantity
    }

    getUserId(): UserId {
        return this.userId
    }

    getProductId(): ProductId {
        return this.productId
    }

    getQuantity(): number {
        return this.quantity
    }
}
