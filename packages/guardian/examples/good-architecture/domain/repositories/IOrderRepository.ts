import { Order } from "../aggregates/Order"
import { OrderId } from "../value-objects/OrderId"
import { UserId } from "../value-objects/UserId"

/**
 * Order Repository Interface
 *
 * DDD Pattern: Repository
 * - Aggregate-oriented persistence
 * - Collection metaphor
 * - No business logic (that's in Order aggregate)
 */
export interface IOrderRepository {
    /**
     * Save order (create or update)
     */
    save(order: Order): Promise<void>

    /**
     * Find order by ID
     */
    findById(id: OrderId): Promise<Order | null>

    /**
     * Find orders by user
     */
    findByUserId(userId: UserId): Promise<Order[]>

    /**
     * Find orders by status
     */
    findByStatus(status: string): Promise<Order[]>

    /**
     * Find all orders
     */
    findAll(): Promise<Order[]>

    /**
     * Delete order
     */
    delete(id: OrderId): Promise<void>

    /**
     * Check if order exists
     */
    exists(id: OrderId): Promise<boolean>
}
