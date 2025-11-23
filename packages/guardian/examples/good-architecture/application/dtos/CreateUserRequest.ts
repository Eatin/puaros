/**
 * Create User Request DTO
 *
 * Application Layer: Input DTO
 * - Validation at system boundary
 * - No domain logic
 * - API contract
 */
export interface CreateUserRequest {
    readonly email: string
    readonly firstName: string
    readonly lastName: string
}
