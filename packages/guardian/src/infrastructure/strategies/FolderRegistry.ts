import { DDD_FOLDER_NAMES } from "../constants/detectorPatterns"

/**
 * Registry for DDD folder names used in aggregate boundary detection
 *
 * Centralizes folder name management for cleaner code organization
 * and easier maintenance of folder name rules.
 */
export class FolderRegistry {
    public readonly entityFolders: Set<string>
    public readonly valueObjectFolders: Set<string>
    public readonly allowedFolders: Set<string>
    public readonly nonAggregateFolders: Set<string>

    constructor() {
        this.entityFolders = new Set<string>([
            DDD_FOLDER_NAMES.ENTITIES,
            DDD_FOLDER_NAMES.AGGREGATES,
        ])

        this.valueObjectFolders = new Set<string>([
            DDD_FOLDER_NAMES.VALUE_OBJECTS,
            DDD_FOLDER_NAMES.VO,
        ])

        this.allowedFolders = new Set<string>([
            DDD_FOLDER_NAMES.VALUE_OBJECTS,
            DDD_FOLDER_NAMES.VO,
            DDD_FOLDER_NAMES.EVENTS,
            DDD_FOLDER_NAMES.DOMAIN_EVENTS,
            DDD_FOLDER_NAMES.REPOSITORIES,
            DDD_FOLDER_NAMES.SERVICES,
            DDD_FOLDER_NAMES.SPECIFICATIONS,
            DDD_FOLDER_NAMES.ERRORS,
            DDD_FOLDER_NAMES.EXCEPTIONS,
        ])

        this.nonAggregateFolders = new Set<string>([
            DDD_FOLDER_NAMES.VALUE_OBJECTS,
            DDD_FOLDER_NAMES.VO,
            DDD_FOLDER_NAMES.EVENTS,
            DDD_FOLDER_NAMES.DOMAIN_EVENTS,
            DDD_FOLDER_NAMES.REPOSITORIES,
            DDD_FOLDER_NAMES.SERVICES,
            DDD_FOLDER_NAMES.SPECIFICATIONS,
            DDD_FOLDER_NAMES.ENTITIES,
            DDD_FOLDER_NAMES.CONSTANTS,
            DDD_FOLDER_NAMES.SHARED,
            DDD_FOLDER_NAMES.FACTORIES,
            DDD_FOLDER_NAMES.PORTS,
            DDD_FOLDER_NAMES.INTERFACES,
            DDD_FOLDER_NAMES.ERRORS,
            DDD_FOLDER_NAMES.EXCEPTIONS,
        ])
    }

    public isEntityFolder(folderName: string): boolean {
        return this.entityFolders.has(folderName)
    }

    public isValueObjectFolder(folderName: string): boolean {
        return this.valueObjectFolders.has(folderName)
    }

    public isAllowedFolder(folderName: string): boolean {
        return this.allowedFolders.has(folderName)
    }

    public isNonAggregateFolder(folderName: string): boolean {
        return this.nonAggregateFolders.has(folderName)
    }
}
