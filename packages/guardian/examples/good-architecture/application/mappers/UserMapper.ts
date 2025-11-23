import { User } from "../../domain/aggregates/User"
import { UserResponseDto } from "../dtos/UserResponseDto"

/**
 * User Mapper
 *
 * DDD Pattern: Mapper
 * - Converts between domain and DTOs
 * - Isolates domain from presentation
 * - No business logic
 *
 * SOLID Principles:
 * - SRP: only mapping
 * - OCP: extend for new DTOs
 *
 * Clean Architecture:
 * - Application layer
 * - Protects domain integrity
 */
export class UserMapper {
    /**
     * Map domain entity to response DTO
     */
    public static toDto(user: User): UserResponseDto {
        return {
            id: user.userId.value,
            email: user.email.value,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            isActive: user.isActive,
            isBlocked: user.isBlocked,
            registeredAt: user.registeredAt.toISOString(),
            lastLoginAt: user.lastLoginAt?.toISOString(),
        }
    }

    /**
     * Map array of entities to DTOs
     */
    public static toDtoList(users: User[]): UserResponseDto[] {
        return users.map((user) => UserMapper.toDto(user))
    }
}
