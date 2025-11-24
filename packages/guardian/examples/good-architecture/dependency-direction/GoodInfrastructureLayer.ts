/**
 * ✅ GOOD: Infrastructure layer with correct dependencies
 *
 * Infrastructure CAN import from:
 * - Domain layer
 * - Application layer
 * - Other infrastructure files
 * - Shared utilities
 * - External libraries (ORM, frameworks, etc.)
 */

import { User } from "../domain/entities/User"
import { UserId } from "../domain/value-objects/UserId"
import { Email } from "../domain/value-objects/Email"
import { IUserRepository } from "../domain/repositories/IUserRepository"
import { CreateUser } from "../application/use-cases/CreateUser"
import { UserResponseDto } from "../application/dtos/UserResponseDto"
import { IEmailService } from "../application/ports/IEmailService"

/**
 * ✅ Infrastructure implements domain interface
 */
export class InMemoryUserRepository implements IUserRepository {
    private users: Map<string, User> = new Map()

    async findById(id: UserId): Promise<User | null> {
        return this.users.get(id.getValue()) ?? null
    }

    async save(user: User): Promise<void> {
        this.users.set(user.getId().getValue(), user)
    }

    async delete(id: UserId): Promise<void> {
        this.users.delete(id.getValue())
    }
}

/**
 * ✅ Infrastructure provides Adapter implementing application Port
 */
export class SmtpEmailService implements IEmailService {
    constructor(
        private readonly host: string,
        private readonly port: number,
    ) {}

    async sendWelcomeEmail(email: string): Promise<void> {
        console.log(`Sending welcome email to ${email} via SMTP`)
    }
}

/**
 * ✅ Controller uses application use cases and DTOs
 */
export class UserController {
    constructor(private readonly createUser: CreateUser) {}

    async create(request: { email: string; name: string }): Promise<UserResponseDto> {
        const result = await this.createUser.execute(request)

        if (result.isFailure) {
            throw new Error(result.error)
        }

        return result.value
    }
}

/**
 * ✅ Infrastructure can use external frameworks
 */
import express from "express"

export class ExpressServer {
    private app = express()

    constructor(private readonly userController: UserController) {
        this.setupRoutes()
    }

    private setupRoutes(): void {
        this.app.post("/users", async (req, res) => {
            const user = await this.userController.create(req.body)
            res.json(user)
        })
    }
}

/**
 * ✅ Infrastructure can use ORM
 */
import { PrismaClient } from "@prisma/client"

export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findById(id: UserId): Promise<User | null> {
        const userData = await this.prisma.user.findUnique({
            where: { id: id.getValue() },
        })

        if (!userData) {
            return null
        }

        return new User(UserId.from(userData.id), Email.create(userData.email).value)
    }

    async save(user: User): Promise<void> {
        await this.prisma.user.upsert({
            where: { id: user.getId().getValue() },
            create: {
                id: user.getId().getValue(),
                email: user.getEmail().getValue(),
            },
            update: {
                email: user.getEmail().getValue(),
            },
        })
    }

    async delete(id: UserId): Promise<void> {
        await this.prisma.user.delete({
            where: { id: id.getValue() },
        })
    }
}
