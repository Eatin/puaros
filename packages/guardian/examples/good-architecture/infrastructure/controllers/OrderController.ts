import { PlaceOrder, PlaceOrderRequest } from "../../application/use-cases/PlaceOrder"
import { OrderResponseDto } from "../../application/dtos/OrderResponseDto"

/**
 * Order Controller
 *
 * Infrastructure Layer: HTTP Controller
 * - No business logic
 * - Returns DTOs (not domain entities!)
 * - Delegates to use cases
 */
export class OrderController {
    constructor(private readonly placeOrder: PlaceOrder) {}

    /**
     * POST /orders
     *
     * ✅ Good: Returns DTO
     * ✅ Good: Delegates to use case
     * ✅ Good: No business logic
     */
    public async placeOrder(request: PlaceOrderRequest): Promise<OrderResponseDto> {
        try {
            return await this.placeOrder.execute(request)
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to place order: ${error.message}`)
            }
            throw error
        }
    }
}
