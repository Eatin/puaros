import { BaseEntity } from "../../../../src/domain/entities/BaseEntity"
import { OrderId } from "../value-objects/OrderId"
import { UserId } from "../value-objects/UserId"
import { OrderStatus } from "../value-objects/OrderStatus"
import { Money } from "../value-objects/Money"
import { OrderItem } from "../entities/OrderItem"

/**
 * Order Aggregate Root
 *
 * DDD Patterns:
 * - Aggregate Root: controls access to OrderItems
 * - Consistency Boundary: all changes through Order
 * - Rich Domain Model: contains business logic
 *
 * SOLID Principles:
 * - SRP: manages order lifecycle
 * - OCP: extensible through status transitions
 * - ISP: focused interface for order operations
 *
 * Business Rules (Invariants):
 * - Order must have at least one item
 * - Cannot modify confirmed/paid/shipped orders
 * - Status transitions must be valid
 * - Total = sum of all items
 * - Cannot cancel delivered orders
 *
 * Clean Code:
 * - No magic numbers: MIN_ITEMS constant
 * - Meaningful names: addItem, removeItem, confirm
 * - Small methods: each does one thing
 * - No hardcoded strings: OrderStatus enum
 */
export class Order extends BaseEntity {
    private static readonly MIN_ITEMS = 1

    private readonly _orderId: OrderId
    private readonly _userId: UserId
    private readonly _items: Map<string, OrderItem>
    private _status: OrderStatus
    private readonly _createdAt: Date
    private _confirmedAt?: Date
    private _deliveredAt?: Date

    private constructor(
        orderId: OrderId,
        userId: UserId,
        items: OrderItem[],
        status: OrderStatus,
        createdAt: Date,
        confirmedAt?: Date,
        deliveredAt?: Date,
    ) {
        super(orderId.value)
        this._orderId = orderId
        this._userId = userId
        this._items = new Map(items.map((item) => [item.id, item]))
        this._status = status
        this._createdAt = createdAt
        this._confirmedAt = confirmedAt
        this._deliveredAt = deliveredAt

        this.validateInvariants()
    }

    /**
     * Factory: Create new order
     */
    public static create(userId: UserId): Order {
        const orderId = OrderId.create()
        const now = new Date()

        return new Order(orderId, userId, [], OrderStatus.PENDING, now)
    }

    /**
     * Factory: Reconstitute from persistence
     */
    public static reconstitute(
        orderId: OrderId,
        userId: UserId,
        items: OrderItem[],
        status: OrderStatus,
        createdAt: Date,
        confirmedAt?: Date,
        deliveredAt?: Date,
    ): Order {
        return new Order(orderId, userId, items, status, createdAt, confirmedAt, deliveredAt)
    }

    /**
     * Business Operation: Add item to order
     *
     * DDD: Only Aggregate Root can modify its entities
     */
    public addItem(productId: string, productName: string, price: Money, quantity: number): void {
        this.ensureCanModify()

        const existingItem = Array.from(this._items.values()).find(
            (item) => item.productId === productId,
        )

        if (existingItem) {
            existingItem.updateQuantity(existingItem.quantity + quantity)
        } else {
            const newItem = OrderItem.create(productId, productName, price, quantity)
            this._items.set(newItem.id, newItem)
        }

        this.touch()
    }

    /**
     * Business Operation: Remove item from order
     */
    public removeItem(itemId: string): void {
        this.ensureCanModify()

        if (!this._items.has(itemId)) {
            throw new Error(`Item not found: ${itemId}`)
        }

        this._items.delete(itemId)
        this.touch()
    }

    /**
     * Business Operation: Update item quantity
     */
    public updateItemQuantity(itemId: string, newQuantity: number): void {
        this.ensureCanModify()

        const item = this._items.get(itemId)

        if (!item) {
            throw new Error(`Item not found: ${itemId}`)
        }

        item.updateQuantity(newQuantity)
        this.touch()
    }

    /**
     * Business Operation: Confirm order
     */
    public confirm(): void {
        this.transitionTo(OrderStatus.CONFIRMED)
        this._confirmedAt = new Date()
    }

    /**
     * Business Operation: Mark as paid
     */
    public markAsPaid(): void {
        this.transitionTo(OrderStatus.PAID)
    }

    /**
     * Business Operation: Ship order
     */
    public ship(): void {
        this.transitionTo(OrderStatus.SHIPPED)
    }

    /**
     * Business Operation: Deliver order
     */
    public deliver(): void {
        this.transitionTo(OrderStatus.DELIVERED)
        this._deliveredAt = new Date()
    }

    /**
     * Business Operation: Cancel order
     */
    public cancel(): void {
        if (this._status.isDelivered()) {
            throw new Error("Cannot cancel delivered order")
        }

        this.transitionTo(OrderStatus.CANCELLED)
    }

    /**
     * Business Query: Calculate total
     */
    public calculateTotal(): Money {
        const items = Array.from(this._items.values())

        if (items.length === 0) {
            return Money.zero("USD")
        }

        return items.reduce((total, item) => total.add(item.calculateTotal()), Money.zero("USD"))
    }

    /**
     * Business Query: Check if order can be modified
     */
    public canModify(): boolean {
        return this._status.isPending()
    }

    /**
     * Getters
     */
    public get orderId(): OrderId {
        return this._orderId
    }

    public get userId(): UserId {
        return this._userId
    }

    public get items(): readonly OrderItem[] {
        return Array.from(this._items.values())
    }

    public get status(): OrderStatus {
        return this._status
    }

    public get createdAt(): Date {
        return this._createdAt
    }

    public get confirmedAt(): Date | undefined {
        return this._confirmedAt
    }

    public get deliveredAt(): Date | undefined {
        return this._deliveredAt
    }

    /**
     * Private helpers
     */
    private ensureCanModify(): void {
        if (!this.canModify()) {
            throw new Error(`Cannot modify order in ${this._status.value} status`)
        }
    }

    private transitionTo(newStatus: OrderStatus): void {
        if (!this._status.canTransitionTo(newStatus)) {
            throw new Error(
                `Invalid status transition: ${this._status.value} -> ${newStatus.value}`,
            )
        }

        this._status = newStatus
        this.touch()
    }

    /**
     * Invariant validation
     */
    private validateInvariants(): void {
        if (!this._status.isPending() && this._items.size < Order.MIN_ITEMS) {
            throw new Error(`Order must have at least ${Order.MIN_ITEMS} item(s)`)
        }
    }
}
