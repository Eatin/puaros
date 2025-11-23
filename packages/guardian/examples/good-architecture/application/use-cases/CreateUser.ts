import { Email } from "../../domain/value-objects/Email"
import { UserRegistrationService } from "../../domain/services/UserRegistrationService"
import { UserMapper } from "../mappers/UserMapper"
import { CreateUserRequest } from "../dtos/CreateUserRequest"
import { UserResponseDto } from "../dtos/UserResponseDto"

/**
 * Use Case: CreateUser
 *
 * DDD Pattern: Application Service / Use Case
 * - Orchestrates domain operations
 * - Transaction boundary
 * - Converts DTOs to domain
 *
 * SOLID Principles:
 * - SRP: handles user creation workflow
 * - DIP: depends on abstractions (UserRegistrationService)
 * - OCP: can extend without modifying
 *
 * Clean Architecture:
 * - Application layer
 * - Uses domain services
 * - Returns DTOs (not domain entities)
 *
 * Clean Code:
 * - Verb+Noun naming: CreateUser
 * - Single purpose
 * - No business logic (delegated to domain)
 */
export class CreateUser {
    constructor(private readonly userRegistrationService: UserRegistrationService) {}

    public async execute(request: CreateUserRequest): Promise<UserResponseDto> {
        this.validateRequest(request)

        const email = Email.create(request.email)

        const user = await this.userRegistrationService.registerUser(
            email,
            request.firstName,
            request.lastName,
        )

        return UserMapper.toDto(user)
    }

    private validateRequest(request: CreateUserRequest): void {
        if (!request.email?.trim()) {
            throw new Error("Email is required")
        }

        if (!request.firstName?.trim()) {
            throw new Error("First name is required")
        }

        if (!request.lastName?.trim()) {
            throw new Error("Last name is required")
        }
    }
}
