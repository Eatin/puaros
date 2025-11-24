/**
 * ❌ BAD EXAMPLE: Direct Entity Reference Across Aggregates
 *
 * Violation: Order aggregate directly imports and uses User entity from User aggregate
 *
 * Problems:
 * 1. Creates tight coupling between aggregates
 * 2. Changes to User entity affect Order aggregate
 * 3. Violates aggregate boundary principles in DDD
 * 4. Makes aggregates not independently modifiable
 */

import { User } from "../user/User"
import { Product } from "../product/Product"

export class Order {
    private id: string
    private user: User
    private product: Product
    private quantity: number

    constructor(id: string, user: User, product: Product, quantity: number) {
        this.id = id
        this.user = user
        this.product = product
        this.quantity = quantity
    }

    getUserEmail(): string {
        return this.user.email
    }

    getProductPrice(): number {
        return this.product.price
    }

    calculateTotal(): number {
        return this.product.price * this.quantity
    }
}
