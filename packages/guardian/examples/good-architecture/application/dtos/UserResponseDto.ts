/**
 * User Response DTO
 *
 * DDD Pattern: Data Transfer Object
 * - No business logic
 * - Presentation layer data structure
 * - Protects domain from external changes
 *
 * SOLID Principles:
 * - SRP: only data transfer
 * - ISP: client-specific interface
 *
 * Clean Architecture:
 * - Application layer DTO
 * - Maps to/from domain
 * - API contracts
 *
 * Benefits:
 * - Domain entity isolation
 * - API versioning
 * - Client-specific data
 */
export interface UserResponseDto {
    readonly id: string
    readonly email: string
    readonly firstName: string
    readonly lastName: string
    readonly fullName: string
    readonly isActive: boolean
    readonly isBlocked: boolean
    readonly registeredAt: string
    readonly lastLoginAt?: string
}
