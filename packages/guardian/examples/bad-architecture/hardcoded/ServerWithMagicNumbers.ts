/**
 * BAD EXAMPLE: Hardcoded values
 *
 * Guardian should detect:
 * ❌ Magic number: 3000 (port)
 * ❌ Magic number: 5000 (timeout)
 * ❌ Magic number: 3 (max retries)
 * ❌ Magic string: "http://localhost:8080" (API URL)
 * ❌ Magic string: "mongodb://localhost:27017/mydb" (DB connection)
 *
 * Why bad:
 * - Hard to maintain
 * - Can't configure per environment
 * - Scattered across codebase
 * - No single source of truth
 */

export class ServerWithMagicNumbers {
    public startServer(): void {
        console.warn("Starting server on port 3000")

        setTimeout(() => {
            console.warn("Server timeout after 5000ms")
        }, 5000)
    }

    public connectToDatabase(): void {
        const connectionString = "mongodb://localhost:27017/mydb"
        console.warn(`Connecting to: ${connectionString}`)
    }

    public async fetchDataWithRetry(): Promise<void> {
        const apiUrl = "http://localhost:8080"
        let attempts = 0
        const maxRetries = 3

        while (attempts < maxRetries) {
            try {
                console.warn(`Fetching from ${apiUrl}`)
                break
            } catch (error) {
                attempts++
            }
        }
    }

    public configureRateLimits(): void {
        const requestsPerMinute = 100
        const burstLimit = 200
        const windowSizeSeconds = 60

        console.warn(
            `Rate limits: ${requestsPerMinute} per ${windowSizeSeconds}s, burst: ${burstLimit}`,
        )
    }
}

/**
 * ✅ GOOD VERSION (for comparison):
 *
 * const DEFAULT_PORT = 3000
 * const TIMEOUT_MS = 5000
 * const MAX_RETRIES = 3
 * const API_BASE_URL = "http://localhost:8080"
 * const DB_CONNECTION_STRING = "mongodb://localhost:27017/mydb"
 * const REQUESTS_PER_MINUTE = 100
 */
