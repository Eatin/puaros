/**
 * ✅ GOOD: Application layer with correct dependencies
 *
 * Application should only import from:
 * - Domain layer
 * - Other application files
 * - Shared utilities
 *
 * Application should NOT import from:
 * - Infrastructure layer
 */

import { User } from "../domain/entities/User"
import { Email } from "../domain/value-objects/Email"
import { UserId } from "../domain/value-objects/UserId"
import { IUserRepository } from "../domain/repositories/IUserRepository"
import { Result } from "../../../src/shared/types/Result"

/**
 * ✅ Use case depends on domain interfaces (IUserRepository)
 * NOT on infrastructure implementations
 */
export class CreateUser {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(request: CreateUserRequest): Promise<Result<UserResponseDto>> {
        const emailResult = Email.create(request.email)
        if (emailResult.isFailure) {
            return Result.fail(emailResult.error)
        }

        const userId = UserId.generate()
        const user = new User(userId, emailResult.value)

        await this.userRepo.save(user)

        return Result.ok(UserMapper.toDto(user))
    }
}

/**
 * ✅ DTO in application layer
 */
export interface CreateUserRequest {
    email: string
    name: string
}

export interface UserResponseDto {
    id: string
    email: string
    createdAt: string
}

/**
 * ✅ Mapper in application layer converting domain to DTO
 */
export class UserMapper {
    static toDto(user: User): UserResponseDto {
        return {
            id: user.getId().getValue(),
            email: user.getEmail().getValue(),
            createdAt: user.getCreatedAt().toISOString(),
        }
    }
}

/**
 * ✅ Application defines Port (interface) for email service
 * Infrastructure will provide the Adapter (implementation)
 */
export interface IEmailService {
    sendWelcomeEmail(email: string): Promise<void>
}

export class SendWelcomeEmail {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly emailService: IEmailService,
    ) {}

    async execute(userId: string): Promise<Result<void>> {
        const user = await this.userRepo.findById(UserId.from(userId))
        if (!user) {
            return Result.fail("User not found")
        }

        await this.emailService.sendWelcomeEmail(user.getEmail().getValue())
        return Result.ok()
    }
}
