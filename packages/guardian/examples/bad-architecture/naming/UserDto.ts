/**
 * BAD EXAMPLE: DTO in Domain Layer
 *
 * Guardian should detect:
 * ❌ DTO in domain layer
 * ❌ DTOs belong in application or infrastructure
 *
 * Why bad:
 * - Domain should have entities and value objects
 * - DTOs are for external communication
 * - Violates layer responsibilities
 */

export class UserDto {
    constructor(
        public id: string,
        public email: string,
    ) {}
}

/**
 * ✅ GOOD VERSION:
 *
 * // domain/entities/User.ts - Entity in domain
 * export class User { ... }
 *
 * // application/dtos/UserDto.ts - DTO in application
 * export interface UserDto { ... }
 */
