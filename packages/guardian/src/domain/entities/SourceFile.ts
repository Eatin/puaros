import { BaseEntity } from "./BaseEntity"
import { ProjectPath } from "../value-objects/ProjectPath"
import { LAYERS } from "../../shared/constants/rules"

/**
 * Represents a source code file in the analyzed project
 */
export class SourceFile extends BaseEntity {
    private readonly _path: ProjectPath
    private readonly _content: string
    private readonly _imports: string[]
    private readonly _exports: string[]
    private readonly _layer?: string

    constructor(
        path: ProjectPath,
        content: string,
        imports: string[] = [],
        exports: string[] = [],
        id?: string,
    ) {
        super(id)
        this._path = path
        this._content = content
        this._imports = imports
        this._exports = exports
        this._layer = this.detectLayer()
    }

    public get path(): ProjectPath {
        return this._path
    }

    public get content(): string {
        return this._content
    }

    public get imports(): string[] {
        return [...this._imports]
    }

    public get exports(): string[] {
        return [...this._exports]
    }

    public get layer(): string | undefined {
        return this._layer
    }

    public addImport(importPath: string): void {
        if (!this._imports.includes(importPath)) {
            this._imports.push(importPath)
            this.touch()
        }
    }

    public addExport(exportName: string): void {
        if (!this._exports.includes(exportName)) {
            this._exports.push(exportName)
            this.touch()
        }
    }

    private detectLayer(): string | undefined {
        const dir = this._path.directory.toLowerCase()

        if (dir.includes(LAYERS.DOMAIN)) {
            return LAYERS.DOMAIN
        }
        if (dir.includes(LAYERS.APPLICATION)) {
            return LAYERS.APPLICATION
        }
        if (dir.includes(LAYERS.INFRASTRUCTURE)) {
            return LAYERS.INFRASTRUCTURE
        }
        if (dir.includes(LAYERS.SHARED)) {
            return LAYERS.SHARED
        }

        return undefined
    }

    public importsFrom(layer: string): boolean {
        return this._imports.some((imp) => imp.toLowerCase().includes(layer))
    }
}
