import { ValueObject } from "./ValueObject"
import { ENTITY_EXPOSURE_MESSAGES } from "../constants/Messages"

interface EntityExposureProps {
    readonly entityName: string
    readonly returnType: string
    readonly filePath: string
    readonly layer: string
    readonly line?: number
    readonly methodName?: string
}

/**
 * Represents an entity exposure violation in the codebase
 *
 * Entity exposure occurs when a domain entity is directly exposed in API responses
 * instead of using DTOs (Data Transfer Objects). This violates the separation of concerns
 * and can lead to exposing internal domain logic to external clients.
 *
 * @example
 * ```typescript
 * // Bad: Controller returning domain entity
 * const exposure = EntityExposure.create(
 *     'User',
 *     'User',
 *     'src/infrastructure/controllers/UserController.ts',
 *     'infrastructure',
 *     25,
 *     'getUser'
 * )
 *
 * console.log(exposure.getMessage())
 * // "Method 'getUser' returns domain entity 'User' instead of DTO"
 * ```
 */
export class EntityExposure extends ValueObject<EntityExposureProps> {
    private constructor(props: EntityExposureProps) {
        super(props)
    }

    public static create(
        entityName: string,
        returnType: string,
        filePath: string,
        layer: string,
        line?: number,
        methodName?: string,
    ): EntityExposure {
        return new EntityExposure({
            entityName,
            returnType,
            filePath,
            layer,
            line,
            methodName,
        })
    }

    public get entityName(): string {
        return this.props.entityName
    }

    public get returnType(): string {
        return this.props.returnType
    }

    public get filePath(): string {
        return this.props.filePath
    }

    public get layer(): string {
        return this.props.layer
    }

    public get line(): number | undefined {
        return this.props.line
    }

    public get methodName(): string | undefined {
        return this.props.methodName
    }

    public getMessage(): string {
        const method = this.props.methodName
            ? `Method '${this.props.methodName}'`
            : ENTITY_EXPOSURE_MESSAGES.METHOD_DEFAULT
        return `${method} returns domain entity '${this.props.entityName}' instead of DTO`
    }

    public getSuggestion(): string {
        const suggestions = [
            `Create a DTO class (e.g., ${this.props.entityName}ResponseDto) in the application layer`,
            `Create a mapper to convert ${this.props.entityName} to ${this.props.entityName}ResponseDto`,
            `Update the method to return ${this.props.entityName}ResponseDto instead of ${this.props.entityName}`,
        ]
        return suggestions.join("\n")
    }

    public getExampleFix(): string {
        return `
// ❌ Bad: Exposing domain entity
async ${this.props.methodName || ENTITY_EXPOSURE_MESSAGES.METHOD_DEFAULT_NAME}(): Promise<${this.props.entityName}> {
    return await this.service.find()
}

// ✅ Good: Using DTO
async ${this.props.methodName || ENTITY_EXPOSURE_MESSAGES.METHOD_DEFAULT_NAME}(): Promise<${this.props.entityName}ResponseDto> {
    const entity = await this.service.find()
    return ${this.props.entityName}Mapper.toDto(entity)
}`
    }
}
