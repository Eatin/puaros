/**
 * Result type for handling success/failure scenarios
 */
export type Result<T, E = Error> = Success<T> | Failure<E>

export class Success<T> {
    public readonly isSuccess = true
    public readonly isFailure = false

    constructor(public readonly value: T) {}

    public static create<T>(value: T): Success<T> {
        return new Success(value)
    }
}

export class Failure<E> {
    public readonly isSuccess = false
    public readonly isFailure = true

    constructor(public readonly error: E) {}

    public static create<E>(error: E): Failure<E> {
        return new Failure(error)
    }
}

export const ok = <T>(value: T): Result<T> => new Success(value)
export const fail = <E>(error: E): Result<never, E> => new Failure(error)
