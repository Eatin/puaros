// ❌ BAD: Exposing domain entity Order in API response

class Order {
    constructor(
        public id: string,
        public items: OrderItem[],
        public total: number,
        public customerId: string,
    ) {}
}

class OrderItem {
    constructor(
        public productId: string,
        public quantity: number,
        public price: number,
    ) {}
}

class BadOrderController {
    async getOrder(orderId: string): Promise<Order> {
        return {
            id: orderId,
            items: [],
            total: 100,
            customerId: "customer-123",
        }
    }

    async listOrders(): Promise<Order[]> {
        return []
    }
}
