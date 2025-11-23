import { OrderFactory } from "../../domain/factories/OrderFactory"
import { IOrderRepository } from "../../domain/repositories/IOrderRepository"
import { UserId } from "../../domain/value-objects/UserId"
import { Money } from "../../domain/value-objects/Money"
import { OrderMapper } from "../mappers/OrderMapper"
import { OrderResponseDto } from "../dtos/OrderResponseDto"

/**
 * Place Order Request
 */
export interface PlaceOrderRequest {
    readonly userId: string
    readonly items: Array<{
        readonly productId: string
        readonly productName: string
        readonly price: number
        readonly currency: string
        readonly quantity: number
    }>
}

/**
 * Use Case: PlaceOrder
 *
 * Application Service:
 * - Orchestrates order placement
 * - Transaction boundary
 * - Validation at system boundary
 *
 * Business Flow:
 * 1. Validate request
 * 2. Create order with items
 * 3. Confirm order
 * 4. Persist order
 * 5. Return DTO
 */
export class PlaceOrder {
    constructor(private readonly orderRepository: IOrderRepository) {}

    public async execute(request: PlaceOrderRequest): Promise<OrderResponseDto> {
        this.validateRequest(request)

        const userId = UserId.create(request.userId)

        const items = request.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            price: Money.create(item.price, item.currency),
            quantity: item.quantity,
        }))

        const order = OrderFactory.createWithItems(userId, items)

        order.confirm()

        await this.orderRepository.save(order)

        return OrderMapper.toDto(order)
    }

    private validateRequest(request: PlaceOrderRequest): void {
        if (!request.userId?.trim()) {
            throw new Error("User ID is required")
        }

        if (!request.items || request.items.length === 0) {
            throw new Error("Order must have at least one item")
        }

        for (const item of request.items) {
            if (!item.productId?.trim()) {
                throw new Error("Product ID is required")
            }

            if (!item.productName?.trim()) {
                throw new Error("Product name is required")
            }

            if (item.price <= 0) {
                throw new Error("Price must be positive")
            }

            if (item.quantity <= 0) {
                throw new Error("Quantity must be positive")
            }
        }
    }
}
