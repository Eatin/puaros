/**
 * ❌ BAD: Application layer with incorrect dependencies
 *
 * Application importing from Infrastructure layer
 * This violates Clean Architecture dependency rules!
 */

import { User } from "../../good-architecture/domain/entities/User"
import { Email } from "../../good-architecture/domain/value-objects/Email"
import { UserId } from "../../good-architecture/domain/value-objects/UserId"

/**
 * ❌ VIOLATION: Application importing from Infrastructure layer
 */
import { PrismaClient } from "@prisma/client"

export class CreateUser {
    /**
     * ❌ VIOLATION: Application use case depending on concrete infrastructure (Prisma)
     */
    constructor(private prisma: PrismaClient) {}

    async execute(email: string): Promise<User> {
        const userId = UserId.generate()
        const emailVO = Email.create(email).value

        /**
         * ❌ VIOLATION: Application logic directly accessing database
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
 * ❌ VIOLATION: Application importing concrete email service from infrastructure
 */
import { SmtpEmailService } from "../../good-architecture/infrastructure/adapters/SmtpEmailService"

export class SendWelcomeEmail {
    /**
     * ❌ VIOLATION: Application depending on concrete infrastructure implementation
     * Should depend on IEmailService interface instead
     */
    constructor(
        private prisma: PrismaClient,
        private emailService: SmtpEmailService,
    ) {}

    async execute(userId: string): Promise<void> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        })

        if (!user) {
            throw new Error("User not found")
        }

        await this.emailService.sendWelcomeEmail(user.email)
    }
}

/**
 * ❌ VIOLATION: Application importing from infrastructure controller
 */
import { UserController } from "../../good-architecture/infrastructure/controllers/UserController"

export class ValidateUser {
    /**
     * ❌ VIOLATION: Application use case depending on infrastructure controller
     * The dependency direction is completely wrong!
     */
    constructor(private userController: UserController) {}

    async execute(userId: string): Promise<boolean> {
        return true
    }
}

/**
 * ❌ VIOLATION: Application importing HTTP framework
 */
import express from "express"

export class ProcessUserRequest {
    /**
     * ❌ VIOLATION: Application layer knows about HTTP/Express
     * HTTP concerns should be in infrastructure layer
     */
    async execute(req: express.Request): Promise<void> {
        const email = req.body.email
        console.log(`Processing user: ${email}`)
    }
}

/**
 * ❌ VIOLATION: Application importing infrastructure repository implementation
 */
import { InMemoryUserRepository } from "../../good-architecture/infrastructure/repositories/InMemoryUserRepository"

export class GetUser {
    /**
     * ❌ VIOLATION: Application depending on concrete repository implementation
     * Should depend on IUserRepository interface from domain
     */
    constructor(private userRepo: InMemoryUserRepository) {}

    async execute(userId: string): Promise<User | null> {
        return await this.userRepo.findById(UserId.from(userId))
    }
}
