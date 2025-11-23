import { IOrderRepository } from "../../domain/repositories/IOrderRepository"
import { Order } from "../../domain/aggregates/Order"
import { OrderId } from "../../domain/value-objects/OrderId"
import { UserId } from "../../domain/value-objects/UserId"

/**
 * In-Memory Order Repository
 */
export class InMemoryOrderRepository implements IOrderRepository {
    private readonly orders: Map<string, Order> = new Map()

    public async save(order: Order): Promise<void> {
        this.orders.set(order.orderId.value, order)
    }

    public async findById(id: OrderId): Promise<Order | null> {
        return this.orders.get(id.value) ?? null
    }

    public async findByUserId(userId: UserId): Promise<Order[]> {
        return Array.from(this.orders.values()).filter(
            (order) => order.userId.value === userId.value,
        )
    }

    public async findByStatus(status: string): Promise<Order[]> {
        return Array.from(this.orders.values()).filter((order) => order.status.value === status)
    }

    public async findAll(): Promise<Order[]> {
        return Array.from(this.orders.values())
    }

    public async delete(id: OrderId): Promise<void> {
        this.orders.delete(id.value)
    }

    public async exists(id: OrderId): Promise<boolean> {
        return this.orders.has(id.value)
    }

    public clear(): void {
        this.orders.clear()
    }
}
