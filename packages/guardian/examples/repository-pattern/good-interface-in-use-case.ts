/**
 * ✅ GOOD EXAMPLE: Repository interface in use case
 *
 * Use case depends on repository interface, not concrete implementation.
 * This follows Dependency Inversion Principle.
 */

class CreateUser {
    constructor(private readonly userRepo: IUserRepository) {}

    async execute(data: CreateUserRequest): Promise<UserResponseDto> {
        const user = User.create(Email.from(data.email), data.name)
        await this.userRepo.save(user)
        return UserMapper.toDto(user)
    }
}

interface IUserRepository {
    save(user: User): Promise<void>
    findByEmail(email: Email): Promise<User | null>
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
