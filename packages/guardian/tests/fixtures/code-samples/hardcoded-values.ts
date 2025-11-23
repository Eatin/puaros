// Test fixture for hardcode detection

// ❌ Should be detected - Magic numbers
export function badTimeouts() {
    setTimeout(() => {}, 5000)
    setInterval(() => {}, 3000)
    const timeout = 10000
}

export function badRetries() {
    const maxRetries = 3
    const attempts = 5
    const retries = 7
}

export function badPorts() {
    const port = 8080
    const PORT = 3000
    const serverPort = 9000
}

export function badLimits() {
    const limit = 50
    const max = 100
    const min = 10
    const maxSize = 1024
}

// ❌ Should be detected - Magic strings
export function badUrls() {
    const apiUrl = "http://localhost:8080"
    const baseUrl = "https://api.example.com"
    const dbUrl = "mongodb://localhost:27017/mydb"
}

export function badStrings() {
    const errorMessage = "Something went wrong"
    const configPath = "/etc/app/config"
}

// ✅ Should NOT be detected - Allowed numbers
export function allowedNumbers() {
    const items = []
    const index = 0
    const increment = 1
    const pair = 2
    const ten = 10
    const hundred = 100
    const thousand = 1000
    const notFound = -1
}

// ✅ Should NOT be detected - Exported constants
export const CONFIG = {
    timeout: 5000,
    port: 8080,
    maxRetries: 3,
} as const

export const API_CONFIG = {
    baseUrl: "http://localhost:3000",
    timeout: 10000,
} as const

export const SETTINGS = {
    nested: {
        deep: {
            value: 999,
        },
    },
} as const

// ✅ Should NOT be detected - Console logs
export function loggingAllowed() {
    console.log("Debug message")
    console.error("Error occurred")
}

// ✅ Should NOT be detected - Test descriptions
describe("test suite", () => {
    test("should work correctly", () => {
        expect(true).toBe(true)
    })
})

// ❌ Should be detected - Generic 3+ digit numbers
export function suspiciousNumbers() {
    const code = 404
    const status = 200
    const buffer = 512
}
