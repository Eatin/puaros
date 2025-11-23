/**
 * Order Response DTO
 */
export interface OrderItemDto {
    readonly id: string
    readonly productId: string
    readonly productName: string
    readonly price: number
    readonly currency: string
    readonly quantity: number
    readonly total: number
}

export interface OrderResponseDto {
    readonly id: string
    readonly userId: string
    readonly items: OrderItemDto[]
    readonly status: string
    readonly subtotal: number
    readonly currency: string
    readonly createdAt: string
    readonly confirmedAt?: string
    readonly deliveredAt?: string
}
