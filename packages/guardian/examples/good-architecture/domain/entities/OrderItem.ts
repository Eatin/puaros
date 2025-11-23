import { BaseEntity } from "../../../../src/domain/entities/BaseEntity"
import { Money } from "../value-objects/Money"

/**
 * OrderItem Entity
 *
 * DDD Pattern: Entity (not Aggregate Root)
 * - Has identity
 * - Part of Order aggregate
 * - Cannot exist without Order
 * - Accessed only through Order
 *
 * Business Rules:
 * - Quantity must be positive
 * - Price must be positive
 * - Total = price * quantity
 */
export class OrderItem extends BaseEntity {
    private readonly _productId: string
    private readonly _productName: string
    private readonly _price: Money
    private _quantity: number

    private constructor(
        productId: string,
        productName: string,
        price: Money,
        quantity: number,
        id?: string,
    ) {
        super(id)
        this._productId = productId
        this._productName = productName
        this._price = price
        this._quantity = quantity

        this.validateInvariants()
    }

    public static create(
        productId: string,
        productName: string,
        price: Money,
        quantity: number,
    ): OrderItem {
        return new OrderItem(productId, productName, price, quantity)
    }

    public static reconstitute(
        productId: string,
        productName: string,
        price: Money,
        quantity: number,
        id: string,
    ): OrderItem {
        return new OrderItem(productId, productName, price, quantity, id)
    }

    public updateQuantity(newQuantity: number): void {
        if (newQuantity <= 0) {
            throw new Error("Quantity must be positive")
        }

        this._quantity = newQuantity
        this.touch()
    }

    public calculateTotal(): Money {
        return this._price.multiply(this._quantity)
    }

    public get productId(): string {
        return this._productId
    }

    public get productName(): string {
        return this._productName
    }

    public get price(): Money {
        return this._price
    }

    public get quantity(): number {
        return this._quantity
    }

    private validateInvariants(): void {
        if (!this._productId?.trim()) {
            throw new Error("Product ID is required")
        }

        if (!this._productName?.trim()) {
            throw new Error("Product name is required")
        }

        if (this._quantity <= 0) {
            throw new Error("Quantity must be positive")
        }
    }
}
