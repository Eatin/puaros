import { Order } from "../../domain/aggregates/Order"
import { OrderItemDto, OrderResponseDto } from "../dtos/OrderResponseDto"

/**
 * Order Mapper
 */
export class OrderMapper {
    public static toDto(order: Order): OrderResponseDto {
        const total = order.calculateTotal()

        return {
            id: order.orderId.value,
            userId: order.userId.value,
            items: order.items.map((item) => OrderMapper.toItemDto(item)),
            status: order.status.value,
            subtotal: total.amount,
            currency: total.currency,
            createdAt: order.createdAt.toISOString(),
            confirmedAt: order.confirmedAt?.toISOString(),
            deliveredAt: order.deliveredAt?.toISOString(),
        }
    }

    private static toItemDto(item: any): OrderItemDto {
        const total = item.calculateTotal()

        return {
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            price: item.price.amount,
            currency: item.price.currency,
            quantity: item.quantity,
            total: total.amount,
        }
    }

    public static toDtoList(orders: Order[]): OrderResponseDto[] {
        return orders.map((order) => OrderMapper.toDto(order))
    }
}
