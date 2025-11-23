import { CreateUser } from "../../application/use-cases/CreateUser"
import { CreateUserRequest } from "../../application/dtos/CreateUserRequest"
import { UserResponseDto } from "../../application/dtos/UserResponseDto"

/**
 * User Controller
 *
 * Clean Architecture: Infrastructure / Presentation Layer
 * - HTTP concerns (not in use case)
 * - Request/Response handling
 * - Error handling
 * - Delegates to use cases
 *
 * SOLID Principles:
 * - SRP: HTTP handling only
 * - DIP: depends on use case abstraction
 * - OCP: can add new endpoints
 *
 * Important:
 * - NO business logic here
 * - NO domain entities exposed
 * - Returns DTOs only
 * - Use cases do the work
 */
export class UserController {
    constructor(private readonly createUser: CreateUser) {}

    /**
     * POST /users
     *
     * Clean Code:
     * - Returns DTO, not domain entity
     * - Delegates to use case
     * - Focused method
     */
    public async createUser(request: CreateUserRequest): Promise<UserResponseDto> {
        try {
            return await this.createUser.execute(request)
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to create user: ${error.message}`)
            }
            throw error
        }
    }
}
