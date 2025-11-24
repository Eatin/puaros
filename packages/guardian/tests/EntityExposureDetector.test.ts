import { describe, it, expect, beforeEach } from "vitest"
import { EntityExposureDetector } from "../src/infrastructure/analyzers/EntityExposureDetector"

describe("EntityExposureDetector", () => {
    let detector: EntityExposureDetector

    beforeEach(() => {
        detector = new EntityExposureDetector()
    })

    describe("detectExposures", () => {
        it("should detect entity exposure in controller", () => {
            const code = `
class UserController {
    async getUser(id: string): Promise<User> {
        return this.userService.findById(id)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/controllers/UserController.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(1)
            expect(exposures[0].entityName).toBe("User")
            expect(exposures[0].returnType).toBe("User")
            expect(exposures[0].methodName).toBe("getUser")
            expect(exposures[0].layer).toBe("infrastructure")
        })

        it("should detect multiple entity exposures", () => {
            const code = `
class OrderController {
    async getOrder(id: string): Promise<Order> {
        return this.orderService.findById(id)
    }

    async getUser(userId: string): Promise<User> {
        return this.userService.findById(userId)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/controllers/OrderController.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(2)
            expect(exposures[0].entityName).toBe("Order")
            expect(exposures[1].entityName).toBe("User")
        })

        it("should not detect DTO return types", () => {
            const code = `
class UserController {
    async getUser(id: string): Promise<UserResponseDto> {
        const user = await this.userService.findById(id)
        return UserMapper.toDto(user)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/controllers/UserController.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(0)
        })

        it("should not detect primitive return types", () => {
            const code = `
class UserController {
    async getUserCount(): Promise<number> {
        return this.userService.count()
    }

    async getUserName(id: string): Promise<string> {
        return this.userService.getName(id)
    }

    async deleteUser(id: string): Promise<void> {
        await this.userService.delete(id)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/controllers/UserController.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(0)
        })

        it("should not detect exposures in non-controller files", () => {
            const code = `
class UserService {
    async findById(id: string): Promise<User> {
        return this.repository.findById(id)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/application/services/UserService.ts",
                "application",
            )

            expect(exposures).toHaveLength(0)
        })

        it("should not detect exposures outside infrastructure layer", () => {
            const code = `
class CreateUser {
    async execute(request: CreateUserRequest): Promise<User> {
        return User.create(request)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/application/use-cases/CreateUser.ts",
                "application",
            )

            expect(exposures).toHaveLength(0)
        })

        it("should detect exposures in route handlers", () => {
            const code = `
class UserRoutes {
    async getUser(id: string): Promise<User> {
        return this.service.findById(id)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/routes/UserRoutes.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(1)
            expect(exposures[0].entityName).toBe("User")
        })

        it("should detect exposures with async methods", () => {
            const code = `
class UserHandler {
    async handleGetUser(id: string): Promise<User> {
        return this.service.findById(id)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/handlers/UserHandler.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(1)
        })

        it("should not detect Request/Response suffixes", () => {
            const code = `
class UserController {
    async createUser(request: CreateUserRequest): Promise<UserResponse> {
        return this.service.create(request)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/controllers/UserController.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(0)
        })

        it("should handle undefined layer", () => {
            const code = `
class UserController {
    async getUser(id: string): Promise<User> {
        return this.service.findById(id)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/controllers/UserController.ts",
                undefined,
            )

            expect(exposures).toHaveLength(0)
        })
    })

    describe("isDomainEntity", () => {
        it("should identify PascalCase nouns as entities", () => {
            expect(detector.isDomainEntity("User")).toBe(true)
            expect(detector.isDomainEntity("Order")).toBe(true)
            expect(detector.isDomainEntity("Product")).toBe(true)
        })

        it("should not identify DTOs", () => {
            expect(detector.isDomainEntity("UserDto")).toBe(false)
            expect(detector.isDomainEntity("UserDTO")).toBe(false)
            expect(detector.isDomainEntity("UserResponse")).toBe(false)
            expect(detector.isDomainEntity("CreateUserRequest")).toBe(false)
        })

        it("should not identify primitives", () => {
            expect(detector.isDomainEntity("string")).toBe(false)
            expect(detector.isDomainEntity("number")).toBe(false)
            expect(detector.isDomainEntity("boolean")).toBe(false)
            expect(detector.isDomainEntity("void")).toBe(false)
            expect(detector.isDomainEntity("any")).toBe(false)
            expect(detector.isDomainEntity("unknown")).toBe(false)
        })

        it("should handle Promise wrapped types", () => {
            expect(detector.isDomainEntity("Promise<User>")).toBe(true)
            expect(detector.isDomainEntity("Promise<UserDto>")).toBe(false)
        })

        it("should handle array types", () => {
            expect(detector.isDomainEntity("User[]")).toBe(true)
            expect(detector.isDomainEntity("UserDto[]")).toBe(false)
        })

        it("should handle union types", () => {
            expect(detector.isDomainEntity("User | null")).toBe(true)
            expect(detector.isDomainEntity("UserDto | null")).toBe(false)
        })

        it("should not identify non-PascalCase", () => {
            expect(detector.isDomainEntity("user")).toBe(false)
            expect(detector.isDomainEntity("USER")).toBe(false)
            expect(detector.isDomainEntity("user_entity")).toBe(false)
        })

        it("should handle empty strings", () => {
            expect(detector.isDomainEntity("")).toBe(false)
            expect(detector.isDomainEntity("   ")).toBe(false)
        })

        it("should identify Command/Query/Result suffixes as allowed", () => {
            expect(detector.isDomainEntity("CreateUserCommand")).toBe(false)
            expect(detector.isDomainEntity("GetUserQuery")).toBe(false)
            expect(detector.isDomainEntity("UserResult")).toBe(false)
        })
    })

    describe("Real-world scenarios", () => {
        it("should detect User entity exposure in REST API", () => {
            const code = `
class UserController {
    async getUser(req: Request, res: Response): Promise<User> {
        const user = await this.userService.findById(req.params.id)
        return user
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/controllers/UserController.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(1)
            expect(exposures[0].entityName).toBe("User")
            expect(exposures[0].getMessage()).toContain("returns domain entity 'User'")
        })

        it("should detect Order entity exposure in GraphQL resolver", () => {
            const code = `
class OrderResolver {
    async getOrder(id: string): Promise<Order> {
        return this.orderService.findById(id)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/resolvers/OrderResolver.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(1)
            expect(exposures[0].entityName).toBe("Order")
        })

        it("should allow DTO usage in controller", () => {
            const code = `
class UserController {
    async getUser(id: string): Promise<UserResponseDto> {
        const user = await this.userService.findById(id)
        return UserMapper.toDto(user)
    }

    async createUser(request: CreateUserRequest): Promise<UserResponseDto> {
        const user = await this.userService.create(request)
        return UserMapper.toDto(user)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/controllers/UserController.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(0)
        })

        it("should detect mixed exposures and DTOs", () => {
            const code = `
class UserController {
    async getUser(id: string): Promise<User> {
        return this.userService.findById(id)
    }

    async listUsers(): Promise<UserListResponse> {
        const users = await this.userService.findAll()
        return UserMapper.toListDto(users)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/controllers/UserController.ts",
                "infrastructure",
            )

            expect(exposures).toHaveLength(1)
            expect(exposures[0].methodName).toBe("getUser")
        })

        it("should provide helpful suggestions", () => {
            const code = `
class UserController {
    async getUser(id: string): Promise<User> {
        return this.userService.findById(id)
    }
}
`
            const exposures = detector.detectExposures(
                code,
                "src/infrastructure/controllers/UserController.ts",
                "infrastructure",
            )

            expect(exposures[0].getSuggestion()).toContain("UserResponseDto")
            expect(exposures[0].getSuggestion()).toContain("mapper")
        })
    })
})
