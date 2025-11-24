/**
 * BAD EXAMPLE: Entity Exposure
 *
 * Guardian should detect:
 * ❌ Domain entity returned from controller
 * ❌ No DTO layer
 *
 * Why bad:
 * - Exposes internal structure
 * - Breaking changes propagate to API
 * - Can't version API independently
 * - Security risk (password fields, etc.)
 * - Violates Clean Architecture
 */

class User {
    constructor(
        public id: string,
        public email: string,
        public passwordHash: string,
        public isAdmin: boolean,
    ) {}
}

export class BadUserController {
    /**
     * ❌ BAD: Returning domain entity directly!
     */
    public async getUser(id: string): Promise<User> {
        return new User(id, "user@example.com", "hashed_password_exposed!", true)
    }

    /**
     * ❌ BAD: Accepting domain entity as input!
     */
    public async updateUser(user: User): Promise<User> {
        return user
    }
}

/**
 * ✅ GOOD VERSION:
 *
 * // application/dtos/UserResponseDto.ts
 * export interface UserResponseDto {
 *     readonly id: string
 *     readonly email: string
 *     // NO password, NO internal fields
 * }
 *
 * // infrastructure/controllers/UserController.ts
 * export class UserController {
 *     async getUser(id: string): Promise<UserResponseDto> {
 *         const user = await this.getUserUseCase.execute(id)
 *         return UserMapper.toDto(user) // Convert to DTO!
 *     }
 * }
 */
