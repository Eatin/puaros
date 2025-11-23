import { ValueObject } from "./ValueObject"
import * as path from "path"
import { FILE_EXTENSIONS } from "../../shared/constants"

interface ProjectPathProps {
    readonly absolutePath: string
    readonly relativePath: string
}

/**
 * Value object representing a file path in the analyzed project
 */
export class ProjectPath extends ValueObject<ProjectPathProps> {
    private constructor(props: ProjectPathProps) {
        super(props)
    }

    public static create(absolutePath: string, projectRoot: string): ProjectPath {
        const relativePath = path.relative(projectRoot, absolutePath)
        return new ProjectPath({ absolutePath, relativePath })
    }

    public get absolute(): string {
        return this.props.absolutePath
    }

    public get relative(): string {
        return this.props.relativePath
    }

    public get extension(): string {
        return path.extname(this.props.absolutePath)
    }

    public get filename(): string {
        return path.basename(this.props.absolutePath)
    }

    public get directory(): string {
        return path.dirname(this.props.relativePath)
    }

    public isTypeScript(): boolean {
        return (
            this.extension === FILE_EXTENSIONS.TYPESCRIPT ||
            this.extension === FILE_EXTENSIONS.TYPESCRIPT_JSX
        )
    }

    public isJavaScript(): boolean {
        return (
            this.extension === FILE_EXTENSIONS.JAVASCRIPT ||
            this.extension === FILE_EXTENSIONS.JAVASCRIPT_JSX
        )
    }
}
