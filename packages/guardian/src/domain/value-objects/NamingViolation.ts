import { ValueObject } from "./ValueObject"
import { NAMING_VIOLATION_TYPES } from "../../shared/constants/rules"

export type NamingViolationType =
    (typeof NAMING_VIOLATION_TYPES)[keyof typeof NAMING_VIOLATION_TYPES]

interface NamingViolationProps {
    readonly fileName: string
    readonly violationType: NamingViolationType
    readonly layer: string
    readonly filePath: string
    readonly expected: string
    readonly actual: string
    readonly suggestion?: string
}

/**
 * Represents a naming convention violation found in source code
 */
export class NamingViolation extends ValueObject<NamingViolationProps> {
    private constructor(props: NamingViolationProps) {
        super(props)
    }

    public static create(
        fileName: string,
        violationType: NamingViolationType,
        layer: string,
        filePath: string,
        expected: string,
        actual: string,
        suggestion?: string,
    ): NamingViolation {
        return new NamingViolation({
            fileName,
            violationType,
            layer,
            filePath,
            expected,
            actual,
            suggestion,
        })
    }

    public get fileName(): string {
        return this.props.fileName
    }

    public get violationType(): NamingViolationType {
        return this.props.violationType
    }

    public get layer(): string {
        return this.props.layer
    }

    public get filePath(): string {
        return this.props.filePath
    }

    public get expected(): string {
        return this.props.expected
    }

    public get actual(): string {
        return this.props.actual
    }

    public get suggestion(): string | undefined {
        return this.props.suggestion
    }

    public getMessage(): string {
        const baseMessage = `File "${this.fileName}" in "${this.layer}" layer violates naming convention`

        if (this.suggestion) {
            return `${baseMessage}. Expected: ${this.expected}. Suggestion: ${this.suggestion}`
        }

        return `${baseMessage}. Expected: ${this.expected}`
    }
}
