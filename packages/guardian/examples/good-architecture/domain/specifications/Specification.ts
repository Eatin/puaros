/**
 * Specification Pattern (base class)
 *
 * DDD Pattern: Specification
 * - Encapsulates business rules
 * - Reusable predicates
 * - Combinable (AND, OR, NOT)
 * - Testable in isolation
 *
 * SOLID Principles:
 * - SRP: each specification has one rule
 * - OCP: extend by creating new specifications
 * - LSP: all specifications are substitutable
 *
 * Benefits:
 * - Business rules as first-class citizens
 * - Reusable across use cases
 * - Easy to test
 * - Can be combined
 */
export abstract class Specification<T> {
    /**
     * Check if entity satisfies specification
     */
    public abstract isSatisfiedBy(entity: T): boolean

    /**
     * Combine specifications with AND
     */
    public and(other: Specification<T>): Specification<T> {
        return new AndSpecification(this, other)
    }

    /**
     * Combine specifications with OR
     */
    public or(other: Specification<T>): Specification<T> {
        return new OrSpecification(this, other)
    }

    /**
     * Negate specification
     */
    public not(): Specification<T> {
        return new NotSpecification(this)
    }
}

/**
 * AND Specification
 */
class AndSpecification<T> extends Specification<T> {
    constructor(
        private readonly left: Specification<T>,
        private readonly right: Specification<T>,
    ) {
        super()
    }

    public isSatisfiedBy(entity: T): boolean {
        return this.left.isSatisfiedBy(entity) && this.right.isSatisfiedBy(entity)
    }
}

/**
 * OR Specification
 */
class OrSpecification<T> extends Specification<T> {
    constructor(
        private readonly left: Specification<T>,
        private readonly right: Specification<T>,
    ) {
        super()
    }

    public isSatisfiedBy(entity: T): boolean {
        return this.left.isSatisfiedBy(entity) || this.right.isSatisfiedBy(entity)
    }
}

/**
 * NOT Specification
 */
class NotSpecification<T> extends Specification<T> {
    constructor(private readonly spec: Specification<T>) {
        super()
    }

    public isSatisfiedBy(entity: T): boolean {
        return !this.spec.isSatisfiedBy(entity)
    }
}
