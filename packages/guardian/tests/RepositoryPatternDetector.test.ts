import { describe, it, expect, beforeEach } from "vitest"
import { RepositoryPatternDetector } from "../src/infrastructure/analyzers/RepositoryPatternDetector"
import { REPOSITORY_VIOLATION_TYPES } from "../src/shared/constants/rules"

describe("RepositoryPatternDetector", () => {
    let detector: RepositoryPatternDetector

    beforeEach(() => {
        detector = new RepositoryPatternDetector()
    })

    describe("detectViolations - ORM Types in Interface", () => {
        it("should detect Prisma types in repository interface", () => {
            const code = `
interface IUserRepository {
    findOne(query: Prisma.UserWhereInput): Promise<User>
    create(data: Prisma.UserCreateInput): Promise<User>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            expect(violations.length).toBeGreaterThan(0)
            const ormViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
            )
            expect(ormViolations.length).toBeGreaterThan(0)
            expect(ormViolations[0].getMessage()).toContain("ORM-specific type")
        })

        it("should detect TypeORM decorators in repository interface", () => {
            const code = `
interface IUserRepository {
    @Column()
    findById(id: string): Promise<User>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            const ormViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
            )
            expect(ormViolations.length).toBeGreaterThan(0)
        })

        it("should detect Mongoose types in repository interface", () => {
            const code = `
interface IUserRepository {
    find(query: Model<User>): Promise<User[]>
    findOne(query: Schema): Promise<User>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            const ormViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
            )
            expect(ormViolations.length).toBeGreaterThan(0)
        })

        it("should not detect ORM types in clean interface", () => {
            const code = `
interface IUserRepository {
    findById(id: UserId): Promise<User | null>
    save(user: User): Promise<void>
    delete(id: UserId): Promise<void>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            const ormViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
            )
            expect(ormViolations).toHaveLength(0)
        })
    })

    describe("detectViolations - Concrete Repository in Use Case", () => {
        it("should detect concrete repository in constructor", () => {
            const code = `
class CreateUser {
    constructor(private userRepo: PrismaUserRepository) {}
}
`
            const violations = detector.detectViolations(
                code,
                "src/application/use-cases/CreateUser.ts",
                "application",
            )

            const concreteViolations = violations.filter(
                (v) =>
                    v.violationType === REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
            )
            expect(concreteViolations).toHaveLength(1)
            expect(concreteViolations[0].repositoryName).toBe("PrismaUserRepository")
        })

        it("should detect concrete repository as field", () => {
            const code = `
class CreateUser {
    private userRepo: MongoUserRepository
}
`
            const violations = detector.detectViolations(
                code,
                "src/application/use-cases/CreateUser.ts",
                "application",
            )

            const concreteViolations = violations.filter(
                (v) =>
                    v.violationType === REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
            )
            expect(concreteViolations).toHaveLength(1)
        })

        it("should not detect interface in constructor", () => {
            const code = `
class CreateUser {
    constructor(private userRepo: IUserRepository) {}
}
`
            const violations = detector.detectViolations(
                code,
                "src/application/use-cases/CreateUser.ts",
                "application",
            )

            const concreteViolations = violations.filter(
                (v) =>
                    v.violationType === REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
            )
            expect(concreteViolations).toHaveLength(0)
        })
    })

    describe("detectViolations - new Repository() in Use Case", () => {
        it("should detect repository instantiation with new", () => {
            const code = `
class CreateUser {
    async execute(data: CreateUserRequest) {
        const repo = new UserRepository()
        await repo.save(user)
    }
}
`
            const violations = detector.detectViolations(
                code,
                "src/application/use-cases/CreateUser.ts",
                "application",
            )

            const newRepoViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
            )
            expect(newRepoViolations).toHaveLength(1)
            expect(newRepoViolations[0].repositoryName).toBe("UserRepository")
        })

        it("should detect multiple repository instantiations", () => {
            const code = `
class ComplexUseCase {
    async execute() {
        const userRepo = new UserRepository()
        const orderRepo = new OrderRepository()
        await userRepo.save(user)
        await orderRepo.save(order)
    }
}
`
            const violations = detector.detectViolations(
                code,
                "src/application/use-cases/ComplexUseCase.ts",
                "application",
            )

            const newRepoViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
            )
            expect(newRepoViolations).toHaveLength(2)
        })

        it("should not detect commented out new Repository()", () => {
            const code = `
class CreateUser {
    async execute(data: CreateUserRequest) {
        // const repo = new UserRepository()
        await this.userRepo.save(user)
    }
}
`
            const violations = detector.detectViolations(
                code,
                "src/application/use-cases/CreateUser.ts",
                "application",
            )

            const newRepoViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
            )
            expect(newRepoViolations).toHaveLength(0)
        })
    })

    describe("detectViolations - Non-Domain Method Names", () => {
        it("should detect technical method names", () => {
            const code = `
interface IUserRepository {
    findOne(id: string): Promise<User>
    findMany(filter: any): Promise<User[]>
    insert(user: User): Promise<void>
    updateOne(id: string, data: any): Promise<void>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            const methodViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
            )
            expect(methodViolations.length).toBeGreaterThan(0)
            expect(methodViolations.some((v) => v.methodName === "findOne")).toBe(true)
            expect(methodViolations.some((v) => v.methodName === "insert")).toBe(true)
        })

        it("should not detect domain language method names", () => {
            const code = `
interface IUserRepository {
    findById(id: UserId): Promise<User | null>
    findByEmail(email: Email): Promise<User | null>
    save(user: User): Promise<void>
    delete(id: UserId): Promise<void>
    search(criteria: SearchCriteria): Promise<User[]>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            const methodViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
            )
            expect(methodViolations).toHaveLength(0)
        })

        it("should detect SQL terminology", () => {
            const code = `
interface IUserRepository {
    select(id: string): Promise<User>
    query(filter: any): Promise<User[]>
    execute(sql: string): Promise<any>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            const methodViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
            )
            expect(methodViolations.length).toBeGreaterThan(0)
        })
    })

    describe("isOrmType", () => {
        it("should identify Prisma types", () => {
            expect(detector.isOrmType("Prisma.UserWhereInput")).toBe(true)
            expect(detector.isOrmType("PrismaClient")).toBe(true)
        })

        it("should identify TypeORM decorators", () => {
            expect(detector.isOrmType("@Entity")).toBe(true)
            expect(detector.isOrmType("@Column")).toBe(true)
            expect(detector.isOrmType("@ManyToOne")).toBe(true)
        })

        it("should identify Mongoose types", () => {
            expect(detector.isOrmType("Schema")).toBe(true)
            expect(detector.isOrmType("Model<User>")).toBe(true)
            expect(detector.isOrmType("Document")).toBe(true)
        })

        it("should not identify domain types", () => {
            expect(detector.isOrmType("User")).toBe(false)
            expect(detector.isOrmType("UserId")).toBe(false)
            expect(detector.isOrmType("Email")).toBe(false)
        })
    })

    describe("isDomainMethodName", () => {
        it("should identify domain method names", () => {
            expect(detector.isDomainMethodName("findById")).toBe(true)
            expect(detector.isDomainMethodName("findByEmail")).toBe(true)
            expect(detector.isDomainMethodName("save")).toBe(true)
            expect(detector.isDomainMethodName("delete")).toBe(true)
            expect(detector.isDomainMethodName("create")).toBe(true)
            expect(detector.isDomainMethodName("search")).toBe(true)
        })

        it("should reject technical method names", () => {
            expect(detector.isDomainMethodName("findOne")).toBe(false)
            expect(detector.isDomainMethodName("findMany")).toBe(false)
            expect(detector.isDomainMethodName("insert")).toBe(false)
            expect(detector.isDomainMethodName("updateOne")).toBe(false)
            expect(detector.isDomainMethodName("query")).toBe(false)
            expect(detector.isDomainMethodName("execute")).toBe(false)
        })
    })

    describe("isRepositoryInterface", () => {
        it("should identify repository interfaces in domain", () => {
            expect(
                detector.isRepositoryInterface(
                    "src/domain/repositories/IUserRepository.ts",
                    "domain",
                ),
            ).toBe(true)
            expect(
                detector.isRepositoryInterface(
                    "src/domain/repositories/IOrderRepository.ts",
                    "domain",
                ),
            ).toBe(true)
        })

        it("should not identify repository implementations in infrastructure", () => {
            expect(
                detector.isRepositoryInterface(
                    "src/infrastructure/repositories/UserRepository.ts",
                    "infrastructure",
                ),
            ).toBe(false)
        })

        it("should not identify non-repository files", () => {
            expect(detector.isRepositoryInterface("src/domain/entities/User.ts", "domain")).toBe(
                false,
            )
        })
    })

    describe("isUseCase", () => {
        it("should identify use cases", () => {
            expect(
                detector.isUseCase("src/application/use-cases/CreateUser.ts", "application"),
            ).toBe(true)
            expect(
                detector.isUseCase("src/application/use-cases/UpdateProfile.ts", "application"),
            ).toBe(true)
            expect(
                detector.isUseCase("src/application/use-cases/DeleteOrder.ts", "application"),
            ).toBe(true)
        })

        it("should not identify DTOs as use cases", () => {
            expect(
                detector.isUseCase("src/application/dtos/UserResponseDto.ts", "application"),
            ).toBe(false)
        })

        it("should not identify use cases in wrong layer", () => {
            expect(detector.isUseCase("src/domain/use-cases/CreateUser.ts", "domain")).toBe(false)
        })
    })

    describe("getMessage and getSuggestion", () => {
        it("should provide helpful message for ORM type violations", () => {
            const code = `
interface IUserRepository {
    findOne(query: Prisma.UserWhereInput): Promise<User>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            const ormViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE,
            )
            expect(ormViolations[0].getMessage()).toContain("ORM-specific type")
            expect(ormViolations[0].getSuggestion()).toContain("domain types")
        })

        it("should provide helpful message for concrete repository violations", () => {
            const code = `
class CreateUser {
    constructor(private userRepo: PrismaUserRepository) {}
}
`
            const violations = detector.detectViolations(
                code,
                "src/application/use-cases/CreateUser.ts",
                "application",
            )

            const concreteViolations = violations.filter(
                (v) =>
                    v.violationType === REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE,
            )
            expect(concreteViolations[0].getMessage()).toContain("concrete repository")
            expect(concreteViolations[0].getSuggestion()).toContain("interface")
        })

        it("should provide helpful message for new repository violations", () => {
            const code = `
class CreateUser {
    async execute() {
        const repo = new UserRepository()
    }
}
`
            const violations = detector.detectViolations(
                code,
                "src/application/use-cases/CreateUser.ts",
                "application",
            )

            const newRepoViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE,
            )
            expect(newRepoViolations[0].getMessage()).toContain("new")
            expect(newRepoViolations[0].getSuggestion()).toContain("dependency injection")
        })

        it("should provide helpful message for non-domain method violations", () => {
            const code = `
interface IUserRepository {
    findOne(id: string): Promise<User>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            const methodViolations = violations.filter(
                (v) => v.violationType === REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME,
            )
            expect(methodViolations[0].getMessage()).toContain("technical name")
            expect(methodViolations[0].getSuggestion()).toContain("domain language")
        })
    })

    describe("Integration tests", () => {
        it("should detect multiple violation types in same file", () => {
            const code = `
interface IUserRepository {
    findOne(query: Prisma.UserWhereInput): Promise<User>
    insert(user: User): Promise<void>
    findById(id: UserId): Promise<User | null>
}
`
            const violations = detector.detectViolations(
                code,
                "src/domain/repositories/IUserRepository.ts",
                "domain",
            )

            expect(violations.length).toBeGreaterThan(1)
            const types = violations.map((v) => v.violationType)
            expect(types).toContain(REPOSITORY_VIOLATION_TYPES.ORM_TYPE_IN_INTERFACE)
            expect(types).toContain(REPOSITORY_VIOLATION_TYPES.NON_DOMAIN_METHOD_NAME)
        })

        it("should detect all violations in complex use case", () => {
            const code = `
class CreateUser {
    constructor(private userRepo: PrismaUserRepository) {}

    async execute(data: CreateUserRequest) {
        const repo = new OrderRepository()
        await this.userRepo.save(user)
        await repo.save(order)
    }
}
`
            const violations = detector.detectViolations(
                code,
                "src/application/use-cases/CreateUser.ts",
                "application",
            )

            expect(violations.length).toBeGreaterThanOrEqual(2)
            const types = violations.map((v) => v.violationType)
            expect(types).toContain(REPOSITORY_VIOLATION_TYPES.CONCRETE_REPOSITORY_IN_USE_CASE)
            expect(types).toContain(REPOSITORY_VIOLATION_TYPES.NEW_REPOSITORY_IN_USE_CASE)
        })
    })
})
