import { REPOSITORY_METHOD_SUGGESTIONS } from "../constants/detectorPatterns"
import { OrmTypeMatcher } from "./OrmTypeMatcher"

/**
 * Validates repository method names for domain language compliance
 *
 * Ensures repository methods use domain language instead of
 * technical database terminology.
 */
export class MethodNameValidator {
    private readonly domainMethodPatterns = [
        /^findBy[A-Z]/,
        /^findAll$/,
        /^find[A-Z]/,
        /^save$/,
        /^saveAll$/,
        /^create$/,
        /^update$/,
        /^delete$/,
        /^deleteBy[A-Z]/,
        /^deleteAll$/,
        /^remove$/,
        /^removeBy[A-Z]/,
        /^removeAll$/,
        /^add$/,
        /^add[A-Z]/,
        /^get[A-Z]/,
        /^getAll$/,
        /^search/,
        /^list/,
        /^has[A-Z]/,
        /^is[A-Z]/,
        /^exists$/,
        /^exists[A-Z]/,
        /^existsBy[A-Z]/,
        /^clear[A-Z]/,
        /^clearAll$/,
        /^store[A-Z]/,
        /^initialize$/,
        /^initializeCollection$/,
        /^close$/,
        /^connect$/,
        /^disconnect$/,
        /^count$/,
        /^countBy[A-Z]/,
    ]

    constructor(private readonly ormMatcher: OrmTypeMatcher) {}

    /**
     * Checks if a method name follows domain language conventions
     */
    public isDomainMethodName(methodName: string): boolean {
        if (this.ormMatcher.isTechnicalMethod(methodName)) {
            return false
        }

        return this.domainMethodPatterns.some((pattern) => pattern.test(methodName))
    }

    /**
     * Suggests better domain method names
     */
    public suggestDomainMethodName(methodName: string): string {
        const lowerName = methodName.toLowerCase()
        const suggestions: string[] = []

        this.collectSuggestions(lowerName, suggestions)

        if (lowerName.includes("get") && lowerName.includes("all")) {
            suggestions.push(
                REPOSITORY_METHOD_SUGGESTIONS.FIND_ALL,
                REPOSITORY_METHOD_SUGGESTIONS.LIST_ALL,
            )
        }

        if (suggestions.length === 0) {
            return REPOSITORY_METHOD_SUGGESTIONS.DEFAULT_SUGGESTION
        }

        return `Consider: ${suggestions.slice(0, 3).join(", ")}`
    }

    /**
     * Collects method name suggestions based on keywords
     */
    private collectSuggestions(lowerName: string, suggestions: string[]): void {
        const suggestionMap: Record<string, string[]> = {
            query: [
                REPOSITORY_METHOD_SUGGESTIONS.SEARCH,
                REPOSITORY_METHOD_SUGGESTIONS.FIND_BY_PROPERTY,
            ],
            select: [
                REPOSITORY_METHOD_SUGGESTIONS.FIND_BY_PROPERTY,
                REPOSITORY_METHOD_SUGGESTIONS.GET_ENTITY,
            ],
            insert: [
                REPOSITORY_METHOD_SUGGESTIONS.CREATE,
                REPOSITORY_METHOD_SUGGESTIONS.ADD_ENTITY,
                REPOSITORY_METHOD_SUGGESTIONS.STORE_ENTITY,
            ],
            update: [
                REPOSITORY_METHOD_SUGGESTIONS.UPDATE,
                REPOSITORY_METHOD_SUGGESTIONS.MODIFY_ENTITY,
            ],
            upsert: [
                REPOSITORY_METHOD_SUGGESTIONS.SAVE,
                REPOSITORY_METHOD_SUGGESTIONS.STORE_ENTITY,
            ],
            remove: [
                REPOSITORY_METHOD_SUGGESTIONS.DELETE,
                REPOSITORY_METHOD_SUGGESTIONS.REMOVE_BY_PROPERTY,
            ],
            fetch: [
                REPOSITORY_METHOD_SUGGESTIONS.FIND_BY_PROPERTY,
                REPOSITORY_METHOD_SUGGESTIONS.GET_ENTITY,
            ],
            retrieve: [
                REPOSITORY_METHOD_SUGGESTIONS.FIND_BY_PROPERTY,
                REPOSITORY_METHOD_SUGGESTIONS.GET_ENTITY,
            ],
            load: [
                REPOSITORY_METHOD_SUGGESTIONS.FIND_BY_PROPERTY,
                REPOSITORY_METHOD_SUGGESTIONS.GET_ENTITY,
            ],
        }

        for (const [keyword, keywords] of Object.entries(suggestionMap)) {
            if (lowerName.includes(keyword)) {
                suggestions.push(...keywords)
            }
        }
    }
}
