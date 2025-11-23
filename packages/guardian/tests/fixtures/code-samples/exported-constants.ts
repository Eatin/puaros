// Test fixture for exported constants detection

// Single-line export const with as const
export const SINGLE_LINE_OBJECT = { value: 123 } as const
export const SINGLE_LINE_ARRAY = [1, 2, 3] as const
export const SINGLE_LINE_NUMBER = 999 as const
export const SINGLE_LINE_STRING = "test" as const

// Multi-line export const with as const
export const MULTI_LINE_CONFIG = {
    timeout: 5000,
    port: 8080,
    retries: 3,
} as const

export const NESTED_CONFIG = {
    api: {
        baseUrl: "http://localhost",
        timeout: 10000,
    },
    db: {
        host: "localhost",
        port: 5432,
    },
} as const

// Array with as const
export const ALLOWED_PORTS = [3000, 8080, 9000] as const

// Without as const (should still be detected as hardcode)
export const NOT_CONST = {
    value: 777,
}

// Regular variable (not exported) - should detect hardcode
const localConfig = {
    timeout: 4000,
}
