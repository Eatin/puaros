import { ValueObject } from "./ValueObject"
import {
    LAYER_APPLICATION,
    LAYER_DOMAIN,
    LAYER_INFRASTRUCTURE,
} from "../../shared/constants/layers"
import { DEPENDENCY_VIOLATION_MESSAGES } from "../constants/Messages"

interface DependencyViolationProps {
    readonly fromLayer: string
    readonly toLayer: string
    readonly importPath: string
    readonly filePath: string
    readonly line?: number
}

/**
 * Represents a dependency direction violation in the codebase
 *
 * Dependency direction violations occur when a layer imports from a layer
 * that it should not depend on according to Clean Architecture principles:
 * - Domain → should not import from Application or Infrastructure
 * - Application → should not import from Infrastructure
 * - Infrastructure → can import from Application and Domain (allowed)
 * - Shared → can be imported by all layers (allowed)
 *
 * @example
 * ```typescript
 * // Bad: Domain importing from Application
 * const violation = DependencyViolation.create(
 *     'domain',
 *     'application',
 *     '../../application/dtos/UserDto',
 *     'src/domain/entities/User.ts',
 *     5
 * )
 *
 * console.log(violation.getMessage())
 * // "Domain layer should not import from Application layer"
 * ```
 */
export class DependencyViolation extends ValueObject<DependencyViolationProps> {
    private constructor(props: DependencyViolationProps) {
        super(props)
    }

    public static create(
        fromLayer: string,
        toLayer: string,
        importPath: string,
        filePath: string,
        line?: number,
    ): DependencyViolation {
        return new DependencyViolation({
            fromLayer,
            toLayer,
            importPath,
            filePath,
            line,
        })
    }

    public get fromLayer(): string {
        return this.props.fromLayer
    }

    public get toLayer(): string {
        return this.props.toLayer
    }

    public get importPath(): string {
        return this.props.importPath
    }

    public get filePath(): string {
        return this.props.filePath
    }

    public get line(): number | undefined {
        return this.props.line
    }

    public getMessage(): string {
        return `${this.capitalizeFirst(this.props.fromLayer)} layer should not import from ${this.capitalizeFirst(this.props.toLayer)} layer`
    }

    public getSuggestion(): string {
        const suggestions: string[] = []

        if (this.props.fromLayer === LAYER_DOMAIN) {
            suggestions.push(
                DEPENDENCY_VIOLATION_MESSAGES.DOMAIN_INDEPENDENCE,
                DEPENDENCY_VIOLATION_MESSAGES.DOMAIN_MOVE_TO_DOMAIN,
                DEPENDENCY_VIOLATION_MESSAGES.DOMAIN_USE_DI,
            )
        } else if (this.props.fromLayer === LAYER_APPLICATION) {
            suggestions.push(
                DEPENDENCY_VIOLATION_MESSAGES.APPLICATION_NO_INFRA,
                DEPENDENCY_VIOLATION_MESSAGES.APPLICATION_DEFINE_PORT,
                DEPENDENCY_VIOLATION_MESSAGES.APPLICATION_IMPLEMENT_ADAPTER,
                DEPENDENCY_VIOLATION_MESSAGES.APPLICATION_USE_DI,
            )
        }

        return suggestions.join("\n")
    }

    public getExampleFix(): string {
        if (this.props.fromLayer === LAYER_DOMAIN && this.props.toLayer === LAYER_INFRASTRUCTURE) {
            return `
// ❌ Bad: Domain depends on Infrastructure (PrismaClient)
// domain/services/UserService.ts
class UserService {
    constructor(private prisma: PrismaClient) {}
}

// ✅ Good: Domain defines interface, Infrastructure implements
// domain/repositories/IUserRepository.ts
interface IUserRepository {
    findById(id: UserId): Promise<User | null>
    save(user: User): Promise<void>
}

// domain/services/UserService.ts
class UserService {
    constructor(private userRepo: IUserRepository) {}
}

// infrastructure/repositories/PrismaUserRepository.ts
class PrismaUserRepository implements IUserRepository {
    constructor(private prisma: PrismaClient) {}
    async findById(id: UserId): Promise<User | null> { }
    async save(user: User): Promise<void> { }
}`
        }

        if (
            this.props.fromLayer === LAYER_APPLICATION &&
            this.props.toLayer === LAYER_INFRASTRUCTURE
        ) {
            return `
// ❌ Bad: Application depends on Infrastructure (SmtpEmailService)
// application/use-cases/SendEmail.ts
class SendWelcomeEmail {
    constructor(private emailService: SmtpEmailService) {}
}

// ✅ Good: Application defines Port, Infrastructure implements Adapter
// application/ports/IEmailService.ts
interface IEmailService {
    send(to: string, subject: string, body: string): Promise<void>
}

// application/use-cases/SendEmail.ts
class SendWelcomeEmail {
    constructor(private emailService: IEmailService) {}
}

// infrastructure/adapters/SmtpEmailService.ts
class SmtpEmailService implements IEmailService {
    async send(to: string, subject: string, body: string): Promise<void> { }
}`
        }

        return ""
    }

    private capitalizeFirst(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }
}
