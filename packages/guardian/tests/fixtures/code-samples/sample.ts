export function add(a: number, b: number): number {
    return a + b
}

export const multiply = (a: number, b: number): number => {
    return a * b
}

export class Calculator {
    public divide(a: number, b: number): number {
        if (b === 0) {
            throw new Error("Division by zero")
        }
        return a / b
    }
}
