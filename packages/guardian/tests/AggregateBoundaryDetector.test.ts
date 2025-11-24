import { describe, it, expect } from "vitest"
import { AggregateBoundaryDetector } from "../src/infrastructure/analyzers/AggregateBoundaryDetector"
import { LAYERS } from "../src/shared/constants/rules"

describe("AggregateBoundaryDetector", () => {
    const detector = new AggregateBoundaryDetector()

    describe("extractAggregateFromPath", () => {
        it("should extract aggregate from domain/aggregates/name path", () => {
            expect(detector.extractAggregateFromPath("src/domain/aggregates/order/Order.ts")).toBe(
                "order",
            )
            expect(detector.extractAggregateFromPath("src/domain/aggregates/user/User.ts")).toBe(
                "user",
            )
            expect(
                detector.extractAggregateFromPath("src/domain/aggregates/product/Product.ts"),
            ).toBe("product")
        })

        it("should extract aggregate from domain/name path", () => {
            expect(detector.extractAggregateFromPath("src/domain/order/Order.ts")).toBe("order")
            expect(detector.extractAggregateFromPath("src/domain/user/User.ts")).toBe("user")
            expect(detector.extractAggregateFromPath("src/domain/cart/ShoppingCart.ts")).toBe(
                "cart",
            )
        })

        it("should extract aggregate from domain/entities/name path", () => {
            expect(detector.extractAggregateFromPath("src/domain/entities/order/Order.ts")).toBe(
                "order",
            )
            expect(detector.extractAggregateFromPath("src/domain/entities/user/User.ts")).toBe(
                "user",
            )
        })

        it("should return undefined for non-domain paths", () => {
            expect(
                detector.extractAggregateFromPath("src/application/use-cases/CreateUser.ts"),
            ).toBeUndefined()
            expect(
                detector.extractAggregateFromPath(
                    "src/infrastructure/repositories/UserRepository.ts",
                ),
            ).toBeUndefined()
            expect(detector.extractAggregateFromPath("src/shared/types/Result.ts")).toBeUndefined()
        })

        it("should return undefined for paths without aggregate structure", () => {
            expect(detector.extractAggregateFromPath("src/domain/User.ts")).toBeUndefined()
            expect(detector.extractAggregateFromPath("src/User.ts")).toBeUndefined()
        })

        it("should handle Windows-style paths", () => {
            expect(
                detector.extractAggregateFromPath("src\\domain\\aggregates\\order\\Order.ts"),
            ).toBe("order")
            expect(detector.extractAggregateFromPath("src\\domain\\user\\User.ts")).toBe("user")
        })
    })

    describe("isAggregateBoundaryViolation", () => {
        it("should detect direct entity import from another aggregate", () => {
            expect(detector.isAggregateBoundaryViolation("../user/User", "order")).toBe(true)
            expect(detector.isAggregateBoundaryViolation("../../user/User", "order")).toBe(true)
            expect(
                detector.isAggregateBoundaryViolation("../../../domain/user/User", "order"),
            ).toBe(true)
        })

        it("should NOT detect import from same aggregate", () => {
            expect(detector.isAggregateBoundaryViolation("../order/Order", "order")).toBe(false)
            expect(detector.isAggregateBoundaryViolation("./OrderItem", "order")).toBe(false)
        })

        it("should NOT detect value object imports", () => {
            expect(
                detector.isAggregateBoundaryViolation("../user/value-objects/UserId", "order"),
            ).toBe(false)
            expect(detector.isAggregateBoundaryViolation("../user/vo/Email", "order")).toBe(false)
        })

        it("should NOT detect event imports", () => {
            expect(
                detector.isAggregateBoundaryViolation("../user/events/UserCreatedEvent", "order"),
            ).toBe(false)
            expect(
                detector.isAggregateBoundaryViolation(
                    "../user/domain-events/UserRegisteredEvent",
                    "order",
                ),
            ).toBe(false)
        })

        it("should NOT detect repository interface imports", () => {
            expect(
                detector.isAggregateBoundaryViolation(
                    "../user/repositories/IUserRepository",
                    "order",
                ),
            ).toBe(false)
        })

        it("should NOT detect service imports", () => {
            expect(
                detector.isAggregateBoundaryViolation("../user/services/UserService", "order"),
            ).toBe(false)
        })

        it("should NOT detect external package imports", () => {
            expect(detector.isAggregateBoundaryViolation("express", "order")).toBe(false)
            expect(detector.isAggregateBoundaryViolation("@nestjs/common", "order")).toBe(false)
        })

        it("should NOT detect imports without path separator", () => {
            expect(detector.isAggregateBoundaryViolation("User", "order")).toBe(false)
        })
    })

    describe("detectViolations", () => {
        describe("Domain layer aggregate boundary violations", () => {
            it("should detect direct entity import from another aggregate", () => {
                const code = `
import { User } from '../user/User'

export class Order {
    constructor(private user: User) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
                expect(violations[0].fromAggregate).toBe("order")
                expect(violations[0].toAggregate).toBe("user")
                expect(violations[0].entityName).toBe("User")
                expect(violations[0].importPath).toBe("../user/User")
                expect(violations[0].line).toBe(2)
            })

            it("should detect multiple entity imports from different aggregates", () => {
                const code = `
import { User } from '../user/User'
import { Product } from '../product/Product'
import { Category } from '../catalog/Category'

export class Order {
    constructor(
        private user: User,
        private product: Product,
        private category: Category
    ) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(3)
                expect(violations[0].entityName).toBe("User")
                expect(violations[1].entityName).toBe("Product")
                expect(violations[2].entityName).toBe("Category")
            })

            it("should NOT detect value object imports", () => {
                const code = `
import { UserId } from '../user/value-objects/UserId'
import { ProductId } from '../product/value-objects/ProductId'

export class Order {
    constructor(
        private userId: UserId,
        private productId: ProductId
    ) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })

            it("should NOT detect event imports", () => {
                const code = `
import { UserCreatedEvent } from '../user/events/UserCreatedEvent'
import { ProductAddedEvent } from '../product/domain-events/ProductAddedEvent'

export class Order {
    handle(event: UserCreatedEvent): void {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })

            it("should NOT detect repository interface imports", () => {
                const code = `
import { IUserRepository } from '../user/repositories/IUserRepository'

export class OrderService {
    constructor(private userRepo: IUserRepository) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/OrderService.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })

            it("should NOT detect imports from same aggregate", () => {
                const code = `
import { OrderItem } from './OrderItem'
import { OrderStatus } from './value-objects/OrderStatus'

export class Order {
    constructor(
        private items: OrderItem[],
        private status: OrderStatus
    ) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })
        })

        describe("Non-domain layers", () => {
            it("should return empty array for application layer", () => {
                const code = `
import { User } from '../../domain/aggregates/user/User'
import { Order } from '../../domain/aggregates/order/Order'

export class CreateOrder {
    constructor() {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/application/use-cases/CreateOrder.ts",
                    LAYERS.APPLICATION,
                )

                expect(violations).toHaveLength(0)
            })

            it("should return empty array for infrastructure layer", () => {
                const code = `
import { User } from '../../domain/aggregates/user/User'

export class UserController {
    constructor() {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/infrastructure/controllers/UserController.ts",
                    LAYERS.INFRASTRUCTURE,
                )

                expect(violations).toHaveLength(0)
            })

            it("should return empty array for undefined layer", () => {
                const code = `import { User } from '../user/User'`
                const violations = detector.detectViolations(code, "src/utils/helper.ts", undefined)

                expect(violations).toHaveLength(0)
            })
        })

        describe("Import statement formats", () => {
            it("should detect violations in named imports", () => {
                const code = `import { User, UserProfile } from '../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
            })

            it("should detect violations in default imports", () => {
                const code = `import User from '../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
            })

            it("should detect violations in namespace imports", () => {
                const code = `import * as UserAggregate from '../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
            })

            it("should detect violations in require statements", () => {
                const code = `const User = require('../user/User')`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
            })
        })

        describe("Different path structures", () => {
            it("should detect violations in domain/aggregates/name structure", () => {
                const code = `import { User } from '../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
                expect(violations[0].fromAggregate).toBe("order")
                expect(violations[0].toAggregate).toBe("user")
            })

            it("should detect violations in domain/name structure", () => {
                const code = `import { User } from '../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
                expect(violations[0].fromAggregate).toBe("order")
                expect(violations[0].toAggregate).toBe("user")
            })

            it("should detect violations in domain/entities/name structure", () => {
                const code = `import { User } from '../../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/entities/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
                expect(violations[0].fromAggregate).toBe("order")
                expect(violations[0].toAggregate).toBe("user")
            })
        })

        describe("Edge cases", () => {
            it("should handle empty code", () => {
                const violations = detector.detectViolations(
                    "",
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })

            it("should handle code with no imports", () => {
                const code = `
export class Order {
    constructor(private id: string) {}
}`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })

            it("should handle file without aggregate in path", () => {
                const code = `import { User } from '../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(0)
            })

            it("should handle comments in imports", () => {
                const code = `
// This is a comment
import { User } from '../user/User' // Bad import
`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations).toHaveLength(1)
            })
        })

        describe("getMessage", () => {
            it("should return correct violation message", () => {
                const code = `import { User } from '../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations[0].getMessage()).toBe(
                    "Order aggregate should not directly reference User entity from User aggregate",
                )
            })

            it("should capitalize aggregate names in message", () => {
                const code = `import { Product } from '../product/Product'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/cart/ShoppingCart.ts",
                    LAYERS.DOMAIN,
                )

                expect(violations[0].getMessage()).toContain("Cart aggregate")
                expect(violations[0].getMessage()).toContain("Product aggregate")
            })
        })

        describe("getSuggestion", () => {
            it("should return suggestions for fixing aggregate boundary violations", () => {
                const code = `import { User } from '../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                const suggestion = violations[0].getSuggestion()
                expect(suggestion).toContain("Reference other aggregates by ID")
                expect(suggestion).toContain("Use Value Objects")
                expect(suggestion).toContain("Avoid direct entity references")
                expect(suggestion).toContain("independently modifiable")
            })
        })

        describe("getExampleFix", () => {
            it("should return example fix for aggregate boundary violation", () => {
                const code = `import { User } from '../user/User'`
                const violations = detector.detectViolations(
                    code,
                    "src/domain/aggregates/order/Order.ts",
                    LAYERS.DOMAIN,
                )

                const example = violations[0].getExampleFix()
                expect(example).toContain("// ❌ Bad")
                expect(example).toContain("// ✅ Good")
                expect(example).toContain("UserId")
                expect(example).toContain("CustomerInfo")
            })
        })
    })

    describe("Complex scenarios", () => {
        it("should detect mixed valid and invalid imports", () => {
            const code = `
import { User } from '../user/User' // VIOLATION
import { UserId } from '../user/value-objects/UserId' // OK
import { Product } from '../product/Product' // VIOLATION
import { ProductId } from '../product/value-objects/ProductId' // OK
import { OrderItem } from './OrderItem' // OK - same aggregate

export class Order {
    constructor(
        private user: User,
        private userId: UserId,
        private product: Product,
        private productId: ProductId,
        private items: OrderItem[]
    ) {}
}`
            const violations = detector.detectViolations(
                code,
                "src/domain/aggregates/order/Order.ts",
                LAYERS.DOMAIN,
            )

            expect(violations).toHaveLength(2)
            expect(violations[0].entityName).toBe("User")
            expect(violations[1].entityName).toBe("Product")
        })

        it("should handle deeply nested import paths", () => {
            const code = `import { User } from '../../../domain/aggregates/user/entities/User'`
            const violations = detector.detectViolations(
                code,
                "src/domain/aggregates/order/Order.ts",
                LAYERS.DOMAIN,
            )

            expect(violations).toHaveLength(1)
            expect(violations[0].entityName).toBe("User")
        })

        it("should detect violations with .ts extension in import", () => {
            const code = `import { User } from '../user/User.ts'`
            const violations = detector.detectViolations(
                code,
                "src/domain/aggregates/order/Order.ts",
                LAYERS.DOMAIN,
            )

            expect(violations).toHaveLength(1)
            expect(violations[0].entityName).toBe("User")
        })
    })
})
