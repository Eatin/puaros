/**
 * BAD EXAMPLE: Framework Leak in Domain Layer
 *
 * Guardian should detect:
 * ❌ Prisma import in domain layer
 * ❌ Framework dependency in domain
 *
 * Why bad:
 * - Domain coupled to infrastructure
 * - Hard to test
 * - Can't change DB without changing domain
 * - Violates Dependency Inversion Principle
 * - Violates Clean Architecture
 */

// ❌ BAD: Framework in domain!
import { PrismaClient } from "@prisma/client"

export class UserEntity {
    constructor(
        public id: string,
        public email: string,
        private readonly prisma: PrismaClient,
    ) {}

    public async save(): Promise<void> {
        await this.prisma.user.create({
            data: {
                id: this.id,
                email: this.email,
            },
        })
    }
}

/**
 * ✅ GOOD VERSION:
 *
 * // domain/entities/User.ts - NO framework imports!
 * export class User {
 *     constructor(
 *         private readonly id: UserId,
 *         private readonly email: Email,
 *     ) {}
 *
 *     // No persistence logic here
 * }
 *
 * // domain/repositories/IUserRepository.ts
 * export interface IUserRepository {
 *     save(user: User): Promise<void>
 * }
 *
 * // infrastructure/repositories/PrismaUserRepository.ts
 * export class PrismaUserRepository implements IUserRepository {
 *     constructor(private readonly prisma: PrismaClient) {}
 *
 *     async save(user: User): Promise<void> {
 *         // Prisma code here
 *     }
 * }
 */
