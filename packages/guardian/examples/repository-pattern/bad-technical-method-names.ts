/**
 * ❌ BAD EXAMPLE: Technical method names
 *
 * Repository interface uses database/ORM terminology instead of domain language.
 * Methods should reflect business operations, not technical implementation.
 */

interface IUserRepository {
    findOne(id: string): Promise<User | null>

    findMany(filter: any): Promise<User[]>

    insert(user: User): Promise<void>

    updateOne(id: string, data: any): Promise<void>

    deleteOne(id: string): Promise<void>

    query(sql: string): Promise<any>

    execute(command: string): Promise<void>

    select(fields: string[]): Promise<User[]>
}

class User {
    constructor(
        public id: string,
        public email: string,
        public name: string,
    ) {}
}
