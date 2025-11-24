import { ValueObject } from "./ValueObject"
import { FRAMEWORK_LEAK_MESSAGES } from "../../shared/constants/rules"

interface FrameworkLeakProps {
    readonly packageName: string
    readonly filePath: string
    readonly layer: string
    readonly category: string
    readonly line?: number
}

/**
 * Represents a framework leak violation in the codebase
 *
 * A framework leak occurs when a domain layer file imports a framework-specific package,
 * creating tight coupling and violating Clean Architecture principles.
 *
 * @example
 * ```typescript
 * // Bad: Domain layer importing Prisma
 * const leak = FrameworkLeak.create(
 *     '@prisma/client',
 *     'src/domain/User.ts',
 *     'domain',
 *     'ORM',
 *     5
 * )
 *
 * console.log(leak.getMessage())
 * // "Domain layer imports framework-specific package "@prisma/client". Use interfaces and dependency injection instead."
 * ```
 */
export class FrameworkLeak extends ValueObject<FrameworkLeakProps> {
    private constructor(props: FrameworkLeakProps) {
        super(props)
    }

    public static create(
        packageName: string,
        filePath: string,
        layer: string,
        category: string,
        line?: number,
    ): FrameworkLeak {
        return new FrameworkLeak({
            packageName,
            filePath,
            layer,
            category,
            line,
        })
    }

    public get packageName(): string {
        return this.props.packageName
    }

    public get filePath(): string {
        return this.props.filePath
    }

    public get layer(): string {
        return this.props.layer
    }

    public get category(): string {
        return this.props.category
    }

    public get line(): number | undefined {
        return this.props.line
    }

    public getMessage(): string {
        return FRAMEWORK_LEAK_MESSAGES.DOMAIN_IMPORT.replace("{package}", this.props.packageName)
    }

    public getSuggestion(): string {
        return FRAMEWORK_LEAK_MESSAGES.SUGGESTION
    }

    public getCategoryDescription(): string {
        switch (this.props.category) {
            case "ORM":
                return "Database ORM/ODM"
            case "WEB_FRAMEWORK":
                return "Web Framework"
            case "HTTP_CLIENT":
                return "HTTP Client"
            case "VALIDATION":
                return "Validation Library"
            case "DI_CONTAINER":
                return "DI Container"
            case "LOGGER":
                return "Logger"
            case "CACHE":
                return "Cache"
            case "MESSAGE_QUEUE":
                return "Message Queue"
            case "EMAIL":
                return "Email Service"
            case "STORAGE":
                return "Storage Service"
            case "TESTING":
                return "Testing Framework"
            case "TEMPLATE_ENGINE":
                return "Template Engine"
            default:
                return "Framework Package"
        }
    }
}
