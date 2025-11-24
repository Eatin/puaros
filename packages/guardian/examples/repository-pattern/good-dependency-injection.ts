/**
 * ✅ GOOD EXAMPLE: Dependency Injection
 *
 * Use case receives dependencies through constructor.
 * This makes code testable and follows SOLID principles.
 */

class CreateUser {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly emailService: IEmailService,
    ) {}

    async execute(data: CreateUserRequest): Promise<UserResponseDto> {
        const user = User.create(Email.from(data.email), data.name)
        await this.userRepo.save(user)
        await this.emailService.sendWelcomeEmail(user.getEmail())
        return UserMapper.toDto(user)
    }
}

interface IUserRepository {
    save(user: User): Promise<void>
    findByEmail(email: Email): Promise<User | null>
}

interface IEmailService {
    sendWelcomeEmail(email: Email): Promise<void>
}

class Email {
    private constructor(private readonly value: string) {}

    static from(value: string): Email {
        if (!value.includes("@")) {
            throw new Error("Invalid email")
        }
        return new Email(value)
    }

    getValue(): string {
        return this.value
    }
}

class User {
    static create(email: Email, name: string): User {
        return new User(email, name)
    }

    private constructor(
        private readonly email: Email,
        private readonly name: string,
    ) {}

    getEmail(): Email {
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
            email: user.getEmail().getValue(),
            name: user.getName(),
        }
    }
}

class UserRepository implements IUserRepository {
    async save(_user: User): Promise<void> {
        console.warn("Saving user to database")
    }

    async findByEmail(_email: Email): Promise<User | null> {
        return null
    }
}

class EmailService implements IEmailService {
    async sendWelcomeEmail(email: Email): Promise<void> {
        console.warn(`Sending welcome email to ${email.getValue()}`)
    }
}
