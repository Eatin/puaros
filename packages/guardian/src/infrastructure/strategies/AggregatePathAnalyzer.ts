import { DDD_FOLDER_NAMES } from "../constants/detectorPatterns"
import { IMPORT_PATTERNS } from "../constants/paths"
import { FolderRegistry } from "./FolderRegistry"

/**
 * Analyzes file paths and imports to extract aggregate information
 *
 * Handles path normalization, aggregate extraction, and entity name detection
 * for aggregate boundary validation.
 */
export class AggregatePathAnalyzer {
    constructor(private readonly folderRegistry: FolderRegistry) {}

    /**
     * Extracts the aggregate name from a file path
     *
     * Handles patterns like:
     * - domain/aggregates/order/Order.ts → 'order'
     * - domain/order/Order.ts → 'order'
     * - domain/entities/order/Order.ts → 'order'
     */
    public extractAggregateFromPath(filePath: string): string | undefined {
        const normalizedPath = this.normalizePath(filePath)
        const segments = this.getPathSegmentsAfterDomain(normalizedPath)

        if (!segments || segments.length < 2) {
            return undefined
        }

        return this.findAggregateInSegments(segments)
    }

    /**
     * Extracts the aggregate name from an import path
     */
    public extractAggregateFromImport(importPath: string): string | undefined {
        const normalizedPath = importPath.replace(IMPORT_PATTERNS.QUOTE, "").toLowerCase()
        const segments = normalizedPath.split("/").filter((seg) => seg !== ".." && seg !== ".")

        if (segments.length === 0) {
            return undefined
        }

        return this.findAggregateInImportSegments(segments)
    }

    /**
     * Extracts the entity name from an import path
     */
    public extractEntityName(importPath: string): string | undefined {
        const normalizedPath = importPath.replace(IMPORT_PATTERNS.QUOTE, "")
        const segments = normalizedPath.split("/")
        const lastSegment = segments[segments.length - 1]

        if (lastSegment) {
            return lastSegment.replace(/\.(ts|js)$/, "")
        }

        return undefined
    }

    /**
     * Normalizes a file path for consistent processing
     */
    private normalizePath(filePath: string): string {
        return filePath.toLowerCase().replace(/\\/g, "/")
    }

    /**
     * Gets path segments after the 'domain' folder
     */
    private getPathSegmentsAfterDomain(normalizedPath: string): string[] | undefined {
        const domainMatch = /(?:^|\/)(domain)\//.exec(normalizedPath)
        if (!domainMatch) {
            return undefined
        }

        const domainEndIndex = domainMatch.index + domainMatch[0].length
        const pathAfterDomain = normalizedPath.substring(domainEndIndex)
        return pathAfterDomain.split("/").filter(Boolean)
    }

    /**
     * Finds aggregate name in path segments after domain folder
     */
    private findAggregateInSegments(segments: string[]): string | undefined {
        if (this.folderRegistry.isEntityFolder(segments[0])) {
            return this.extractFromEntityFolder(segments)
        }

        const aggregate = segments[0]
        if (this.folderRegistry.isNonAggregateFolder(aggregate)) {
            return undefined
        }

        return aggregate
    }

    /**
     * Extracts aggregate from entity folder structure
     */
    private extractFromEntityFolder(segments: string[]): string | undefined {
        if (segments.length < 3) {
            return undefined
        }

        const aggregate = segments[1]
        if (this.folderRegistry.isNonAggregateFolder(aggregate)) {
            return undefined
        }

        return aggregate
    }

    /**
     * Finds aggregate in import path segments
     */
    private findAggregateInImportSegments(segments: string[]): string | undefined {
        const aggregateFromDomainFolder = this.findAggregateAfterDomainFolder(segments)
        if (aggregateFromDomainFolder) {
            return aggregateFromDomainFolder
        }

        return this.findAggregateFromSecondLastSegment(segments)
    }

    /**
     * Finds aggregate after 'domain' or 'aggregates' folder in import
     */
    private findAggregateAfterDomainFolder(segments: string[]): string | undefined {
        for (let i = 0; i < segments.length; i++) {
            const isDomainOrAggregatesFolder =
                segments[i] === DDD_FOLDER_NAMES.DOMAIN ||
                segments[i] === DDD_FOLDER_NAMES.AGGREGATES

            if (!isDomainOrAggregatesFolder) {
                continue
            }

            if (i + 1 >= segments.length) {
                continue
            }

            const nextSegment = segments[i + 1]
            const isEntityOrAggregateFolder =
                this.folderRegistry.isEntityFolder(nextSegment) ||
                nextSegment === DDD_FOLDER_NAMES.AGGREGATES

            if (isEntityOrAggregateFolder) {
                return i + 2 < segments.length ? segments[i + 2] : undefined
            }

            return nextSegment
        }
        return undefined
    }

    /**
     * Extracts aggregate from second-to-last segment if applicable
     */
    private findAggregateFromSecondLastSegment(segments: string[]): string | undefined {
        if (segments.length >= 2) {
            const secondLastSegment = segments[segments.length - 2]

            if (
                !this.folderRegistry.isEntityFolder(secondLastSegment) &&
                !this.folderRegistry.isValueObjectFolder(secondLastSegment) &&
                !this.folderRegistry.isAllowedFolder(secondLastSegment) &&
                secondLastSegment !== DDD_FOLDER_NAMES.DOMAIN
            ) {
                return secondLastSegment
            }
        }

        return undefined
    }
}
