import { OrderService } from "./OrderService"

/**
 * BAD EXAMPLE: Circular Dependency
 *
 * UserService -> OrderService -> UserService
 *
 * Guardian should detect:
 * ❌ Circular dependency cycle
 *
 * Why bad:
 * - Tight coupling
 * - Hard to test
 * - Difficult to understand
 * - Can cause initialization issues
 * - Maintenance nightmare
 *
 * Fix:
 * - Use interfaces
 * - Use domain events
 * - Extract shared logic to third service
 */
export class UserService {
    constructor(private readonly orderService: OrderService) {}

    public getUserOrders(userId: string): void {
        console.warn(`Getting orders for user ${userId}`)
        this.orderService.getOrdersByUser(userId)
    }

    public getUserTotalSpent(userId: string): number {
        return 0
    }
}
