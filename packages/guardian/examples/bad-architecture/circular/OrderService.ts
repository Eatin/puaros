import { UserService } from "./UserService"

/**
 * BAD EXAMPLE: Circular Dependency (part 2)
 *
 * OrderService -> UserService (creates cycle)
 */
export class OrderService {
    constructor(private readonly userService: UserService) {}

    public getOrdersByUser(userId: string): void {
        console.warn(`Getting orders for user ${userId}`)
    }

    public calculateUserDiscount(userId: string): number {
        const totalSpent = this.userService.getUserTotalSpent(userId)
        return totalSpent > 1000 ? 0.1 : 0
    }
}

/**
 * ✅ GOOD VERSION:
 *
 * // interfaces/IOrderService.ts
 * export interface IOrderService {
 *     getOrdersByUser(userId: string): Promise<Order[]>
 * }
 *
 * // UserService.ts
 * constructor(private readonly orderService: IOrderService) {}
 *
 * // OrderService.ts - no dependency on UserService
 * // Use domain events or separate service for discount logic
 */
