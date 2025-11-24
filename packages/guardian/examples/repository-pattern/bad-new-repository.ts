/**
 * ❌ BAD EXAMPLE: Creating repository with 'new' in use case
 *
 * Use case creates repository instances directly.
 * This violates Dependency Injection principle and makes testing difficult.
 */

class CreateUser {
    async execute(data: CreateUserRequest): Promise<UserResponseDto> {
        const userRepo = new UserRepository()
        const emailService = new EmailService()

        const user = User.create(data.email, data.name)
        await userRepo.save(user)
        await emailService.sendWelcomeEmail(user.getEmail())

        return UserMapper.toDto(user)
    }
}

class UserRepository {
    async save(user: User): Promise<void> {
        console.warn("Saving user to database")
    }
}

class EmailService {
    async sendWelcomeEmail(email: string): Promise<void> {
        console.warn(`Sending welcome email to ${email}`)
    }
}

class User {
    static create(email: string, name: string): User {
        return new User(email, name)
    }

    constructor(
        private email: string,
        private name: string,
    ) {}

    getEmail(): string {
        return this.email
    }

    getName(): string {
        return this.name
    }
}

interface CreateUserRequest {
    email: string
    name: string
}

interface UserResponseDto {
    email: string
    name: string
}

class UserMapper {
    static toDto(user: User): UserResponseDto {
        return {
            email: user.getEmail(),
            name: user.getName(),
        }
    }
}
