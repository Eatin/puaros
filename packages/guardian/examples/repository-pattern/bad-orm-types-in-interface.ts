/**
 * ❌ BAD EXAMPLE: ORM-specific types in repository interface
 *
 * This violates Repository Pattern by coupling domain layer to infrastructure (ORM).
 * Domain should remain persistence-agnostic.
 */

import { Prisma, PrismaClient } from "@prisma/client"

interface IUserRepository {
    findOne(query: Prisma.UserWhereInput): Promise<User | null>

    findMany(query: Prisma.UserFindManyArgs): Promise<User[]>

    create(data: Prisma.UserCreateInput): Promise<User>

    update(id: string, data: Prisma.UserUpdateInput): Promise<User>
}

class User {
    constructor(
        public id: string,
        public email: string,
        public name: string,
    ) {}
}
