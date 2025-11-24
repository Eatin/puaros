/**
 * ✅ GOOD EXAMPLE: Using Value Objects for Needed Data
 *
 * Best Practice: When Order needs specific data from other aggregates,
 * use Value Objects to store that data (denormalization)
 *
 * Benefits:
 * 1. Order aggregate has all data it needs
 * 2. No runtime dependency on other aggregates
 * 3. Better performance (no joins needed)
 * 4. Clear contract through Value Objects
 */

import { UserId } from "../user/value-objects/UserId"
import { ProductId } from "../product/value-objects/ProductId"

export class CustomerInfo {
    constructor(
        readonly customerId: UserId,
        readonly customerName: string,
        readonly customerEmail: string,
    ) {}
}

export class ProductInfo {
    constructor(
        readonly productId: ProductId,
        readonly productName: string,
        readonly productPrice: number,
    ) {}
}

export class Order {
    private id: string
    private customer: CustomerInfo
    private product: ProductInfo
    private quantity: number

    constructor(id: string, customer: CustomerInfo, product: ProductInfo, quantity: number) {
        this.id = id
        this.customer = customer
        this.product = product
        this.quantity = quantity
    }

    getCustomerEmail(): string {
        return this.customer.customerEmail
    }

    calculateTotal(): number {
        return this.product.productPrice * this.quantity
    }

    getCustomerInfo(): CustomerInfo {
        return this.customer
    }

    getProductInfo(): ProductInfo {
        return this.product
    }
}
