import { ValueObject } from "./ValueObject"
import { AGGREGATE_VIOLATION_MESSAGES } from "../constants/Messages"

interface AggregateBoundaryViolationProps {
    readonly fromAggregate: string
    readonly toAggregate: string
    readonly entityName: string
    readonly importPath: string
    readonly filePath: string
    readonly line?: number
}

/**
 * Represents an aggregate boundary violation in the codebase
 *
 * Aggregate boundary violations occur when an entity from one aggregate
 * directly references an entity from another aggregate, violating DDD principles:
 * - Aggregates should reference each other only by ID or Value Objects
 * - Direct entity references create tight coupling between aggregates
 * - Changes to one aggregate should not require changes to another
 *
 * @example
 * ```typescript
 * // Bad: Direct entity reference across aggregates
 * const violation = AggregateBoundaryViolation.create(
 *     'order',
 *     'user',
 *     'User',
 *     '../user/User',
 *     'src/domain/aggregates/order/Order.ts',
 *     5
 * )
 *
 * console.log(violation.getMessage())
 * // "Order aggregate should not directly reference User entity from User aggregate"
 * ```
 */
export class AggregateBoundaryViolation extends ValueObject<AggregateBoundaryViolationProps> {
    private constructor(props: AggregateBoundaryViolationProps) {
        super(props)
    }

    public static create(
        fromAggregate: string,
        toAggregate: string,
        entityName: string,
        importPath: string,
        filePath: string,
        line?: number,
    ): AggregateBoundaryViolation {
        return new AggregateBoundaryViolation({
            fromAggregate,
            toAggregate,
            entityName,
            importPath,
            filePath,
            line,
        })
    }

    public get fromAggregate(): string {
        return this.props.fromAggregate
    }

    public get toAggregate(): string {
        return this.props.toAggregate
    }

    public get entityName(): string {
        return this.props.entityName
    }

    public get importPath(): string {
        return this.props.importPath
    }

    public get filePath(): string {
        return this.props.filePath
    }

    public get line(): number | undefined {
        return this.props.line
    }

    public getMessage(): string {
        return `${this.capitalizeFirst(this.props.fromAggregate)} aggregate should not directly reference ${this.props.entityName} entity from ${this.capitalizeFirst(this.props.toAggregate)} aggregate`
    }

    public getSuggestion(): string {
        const suggestions: string[] = [
            AGGREGATE_VIOLATION_MESSAGES.USE_ID_REFERENCE,
            AGGREGATE_VIOLATION_MESSAGES.USE_VALUE_OBJECT,
            AGGREGATE_VIOLATION_MESSAGES.AVOID_DIRECT_REFERENCE,
            AGGREGATE_VIOLATION_MESSAGES.MAINTAIN_INDEPENDENCE,
        ]

        return suggestions.join("\n")
    }

    public getExampleFix(): string {
        return `
// ❌ Bad: Direct entity reference across aggregates
// domain/aggregates/order/Order.ts
import { User } from '../user/User'

class Order {
    constructor(private user: User) {}
}

// ✅ Good: Reference by ID
// domain/aggregates/order/Order.ts
import { UserId } from '../user/value-objects/UserId'

class Order {
    constructor(private userId: UserId) {}
}

// ✅ Good: Use Value Object for needed data
// domain/aggregates/order/value-objects/CustomerInfo.ts
class CustomerInfo {
    constructor(
        readonly customerId: string,
        readonly customerName: string,
        readonly customerEmail: string
    ) {}
}

// domain/aggregates/order/Order.ts
class Order {
    constructor(private customerInfo: CustomerInfo) {}
}`
    }

    private capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }
}
