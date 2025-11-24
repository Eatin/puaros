// ✅ GOOD: Using DTOs and Mappers instead of exposing domain entities

class User {
    constructor(
        private readonly id: string,
        private email: string,
        private password: string,
    ) {}

    getId(): string {
        return this.id
    }

    getEmail(): string {
        return this.email
    }
}

class UserResponseDto {
    constructor(
        public readonly id: string,
        public readonly email: string,
    ) {}
}

class UserMapper {
    static toDto(user: User): UserResponseDto {
        return new UserResponseDto(user.getId(), user.getEmail())
    }
}

class GoodUserController {
    async getUser(userId: string): Promise<UserResponseDto> {
        const user = new User(userId, "user@example.com", "hashed-password")
        return UserMapper.toDto(user)
    }

    async listUsers(): Promise<UserResponseDto[]> {
        const users = [new User("1", "user1@example.com", "password")]
        return users.map((user) => UserMapper.toDto(user))
    }
}
