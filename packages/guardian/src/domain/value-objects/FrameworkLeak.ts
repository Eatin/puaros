import { ValueObject } from "./ValueObject"
import { FRAMEWORK_LEAK_MESSAGES } from "../../shared/constants/rules"
import {
    DEFAULT_FRAMEWORK_CATEGORY_DESCRIPTION,
    FRAMEWORK_CATEGORY_DESCRIPTIONS,
} from "../constants/FrameworkCategories"

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
        return FRAMEWORK_LEAK_MESSAGES.DOMAIN_IMPORT.replace(
            FRAMEWORK_LEAK_MESSAGES.PACKAGE_PLACEHOLDER,
            this.props.packageName,
        )
    }

    public getSuggestion(): string {
        return FRAMEWORK_LEAK_MESSAGES.SUGGESTION
    }

    public getCategoryDescription(): string {
        return (
            FRAMEWORK_CATEGORY_DESCRIPTIONS[
                this.props.category as keyof typeof FRAMEWORK_CATEGORY_DESCRIPTIONS
            ] || DEFAULT_FRAMEWORK_CATEGORY_DESCRIPTION
        )
    }
}
