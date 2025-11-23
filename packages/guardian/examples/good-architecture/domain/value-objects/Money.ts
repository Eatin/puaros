import { ValueObject } from "../../../../src/domain/value-objects/ValueObject"

interface MoneyProps {
    readonly amount: number
    readonly currency: string
}

/**
 * Money Value Object
 *
 * DDD Pattern: Value Object
 * - Encapsulates amount + currency
 * - Immutable
 * - Rich behavior (add, subtract, compare)
 *
 * Prevents common bugs:
 * - Adding different currencies
 * - Negative amounts (when not allowed)
 * - Floating point precision issues
 */
export class Money extends ValueObject<MoneyProps> {
    private static readonly SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "RUB"]
    private static readonly DECIMAL_PLACES = 2

    private constructor(props: MoneyProps) {
        super(props)
    }

    public static create(amount: number, currency: string): Money {
        const upperCurrency = currency.toUpperCase()

        if (!Money.SUPPORTED_CURRENCIES.includes(upperCurrency)) {
            throw new Error(
                `Unsupported currency: ${currency}. Supported: ${Money.SUPPORTED_CURRENCIES.join(", ")}`,
            )
        }

        if (amount < 0) {
            throw new Error("Money amount cannot be negative")
        }

        const rounded = Math.round(amount * 100) / 100

        return new Money({ amount: rounded, currency: upperCurrency })
    }

    public static zero(currency: string): Money {
        return Money.create(0, currency)
    }

    public get amount(): number {
        return this.props.amount
    }

    public get currency(): string {
        return this.props.currency
    }

    public add(other: Money): Money {
        this.ensureSameCurrency(other)
        return Money.create(this.amount + other.amount, this.currency)
    }

    public subtract(other: Money): Money {
        this.ensureSameCurrency(other)
        const result = this.amount - other.amount

        if (result < 0) {
            throw new Error("Cannot subtract: result would be negative")
        }

        return Money.create(result, this.currency)
    }

    public multiply(multiplier: number): Money {
        if (multiplier < 0) {
            throw new Error("Multiplier cannot be negative")
        }
        return Money.create(this.amount * multiplier, this.currency)
    }

    public isGreaterThan(other: Money): boolean {
        this.ensureSameCurrency(other)
        return this.amount > other.amount
    }

    public isLessThan(other: Money): boolean {
        this.ensureSameCurrency(other)
        return this.amount < other.amount
    }

    public isZero(): boolean {
        return this.amount === 0
    }

    private ensureSameCurrency(other: Money): void {
        if (this.currency !== other.currency) {
            throw new Error(
                `Cannot operate on different currencies: ${this.currency} vs ${other.currency}`,
            )
        }
    }

    public toString(): string {
        return `${this.amount.toFixed(Money.DECIMAL_PLACES)} ${this.currency}`
    }
}
