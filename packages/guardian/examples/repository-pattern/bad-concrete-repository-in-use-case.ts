/**
 * ❌ BAD EXAMPLE: Concrete repository in use case
 *
 * Use case depends on concrete repository implementation instead of interface.
 * This violates Dependency Inversion Principle.
 */

class CreateUser {
    constructor(private userRepo: PrismaUserRepository) {}

    async execute(data: CreateUserRequest): Promise<UserResponseDto> {
        const user = User.create(data.email, data.name)
        await this.userRepo.save(user)
        return UserMapper.toDto(user)
    }
}

class PrismaUserRepository {
    constructor(private prisma: any) {}

    async save(user: User): Promise<void> {
        await this.prisma.user.create({
            data: {
                email: user.getEmail(),
                name: user.getName(),
            },
        })
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
