/**
 * ❌ BAD: Domain layer with incorrect dependencies
 *
 * Domain importing from Application and Infrastructure layers
 * This violates Clean Architecture dependency rules!
 */

import { Email } from "../../good-architecture/domain/value-objects/Email"
import { UserId } from "../../good-architecture/domain/value-objects/UserId"

/**
 * ❌ VIOLATION: Domain importing from Application layer
 */
import { UserResponseDto } from "../../good-architecture/application/dtos/UserResponseDto"

export class User {
    private readonly id: UserId
    private email: Email

    constructor(id: UserId, email: Email) {
        this.id = id
        this.email = email
    }

    /**
     * ❌ VIOLATION: Domain entity returning DTO from application layer
     */
    toDto(): UserResponseDto {
        return {
            id: this.id.getValue(),
            email: this.email.getValue(),
            createdAt: new Date().toISOString(),
        }
    }
}

/**
 * ❌ VIOLATION: Domain importing from Infrastructure layer
 */
import { PrismaClient } from "@prisma/client"

export class UserService {
    /**
     * ❌ VIOLATION: Domain service depending on concrete infrastructure implementation
     */
    constructor(private prisma: PrismaClient) {}

    async createUser(email: string): Promise<User> {
        const userId = UserId.generate()
        const emailVO = Email.create(email).value

        /**
         * ❌ VIOLATION: Domain logic directly accessing database
         */
        await this.prisma.user.create({
            data: {
                id: userId.getValue(),
                email: emailVO.getValue(),
            },
        })

        return new User(userId, emailVO)
    }
}

/**
 * ❌ VIOLATION: Domain importing email service from infrastructure
 */
import { SmtpEmailService } from "../../good-architecture/infrastructure/adapters/SmtpEmailService"

export class UserRegistration {
    /**
     * ❌ VIOLATION: Domain depending on infrastructure email service
     */
    constructor(
        private userService: UserService,
        private emailService: SmtpEmailService,
    ) {}

    async register(email: string): Promise<User> {
        const user = await this.userService.createUser(email)

        /**
         * ❌ VIOLATION: Domain calling infrastructure service directly
         */
        await this.emailService.sendWelcomeEmail(email)

        return user
    }
}
