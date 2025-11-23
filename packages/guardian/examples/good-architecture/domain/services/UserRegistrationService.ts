import { User } from "../aggregates/User"
import { Email } from "../value-objects/Email"
import { IUserRepository } from "../repositories/IUserRepository"

/**
 * Domain Service: UserRegistrationService
 *
 * DDD Pattern: Domain Service
 * - Encapsulates business logic that doesn't belong to a single entity
 * - Coordinates multiple aggregates
 * - Stateless
 *
 * When to use Domain Service:
 * - Business logic spans multiple aggregates
 * - Operation doesn't naturally fit in any entity
 * - Need to check uniqueness (requires repository)
 *
 * SOLID Principles:
 * - SRP: handles user registration logic
 * - DIP: depends on IUserRepository abstraction
 * - ISP: focused interface
 *
 * Clean Code:
 * - Meaningful name: clearly registration logic
 * - Small method: does one thing
 * - No magic strings: clear error messages
 */
export class UserRegistrationService {
    constructor(private readonly userRepository: IUserRepository) {}

    /**
     * Business Operation: Register new user
     *
     * Business Rules:
     * - Email must be unique
     * - User must have valid data
     * - Registration creates active user
     *
     * @throws Error if email already exists
     * @throws Error if user data is invalid
     */
    public async registerUser(email: Email, firstName: string, lastName: string): Promise<User> {
        const existingUser = await this.userRepository.findByEmail(email)

        if (existingUser) {
            throw new Error(`User with email ${email.value} already exists`)
        }

        const user = User.create(email, firstName, lastName)

        await this.userRepository.save(user)

        return user
    }

    /**
     * Business Query: Check if email is available
     */
    public async isEmailAvailable(email: Email): boolean {
        const existingUser = await this.userRepository.findByEmail(email)
        return !existingUser
    }
}
