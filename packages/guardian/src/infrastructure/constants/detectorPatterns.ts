/**
 * Naming Convention Detector Constants
 *
 * Following Clean Code principles:
 * - No magic strings
 * - Single source of truth
 * - Easy to maintain
 */

/**
 * Files to exclude from naming convention checks
 */
export const EXCLUDED_FILES = [
    "index.ts",
    "BaseUseCase.ts",
    "BaseMapper.ts",
    "IBaseRepository.ts",
    "BaseEntity.ts",
    "ValueObject.ts",
    "BaseRepository.ts",
    "BaseError.ts",
    "DomainEvent.ts",
    "Suggestions.ts",
] as const

/**
 * File suffixes for pattern matching
 */
export const FILE_SUFFIXES = {
    SERVICE: "Service.ts",
    DTO: "Dto.ts",
    REQUEST: "Request.ts",
    RESPONSE: "Response.ts",
    MAPPER: "Mapper.ts",
    CONTROLLER: "Controller.ts",
    REPOSITORY: "Repository.ts",
    ADAPTER: "Adapter.ts",
} as const

/**
 * Path patterns for detection
 */
export const PATH_PATTERNS = {
    USE_CASES: "/use-cases/",
    USE_CASES_ALT: "/usecases/",
} as const

/**
 * Common words for pattern matching
 */
export const PATTERN_WORDS = {
    REPOSITORY: "Repository",
    I_PREFIX: "I",
} as const

/**
 * Error messages for naming violations
 */
export const NAMING_ERROR_MESSAGES = {
    DOMAIN_FORBIDDEN:
        "Domain layer should not contain DTOs, Controllers, or Request/Response objects",
    USE_PASCAL_CASE: "Use PascalCase noun (e.g., User.ts, Order.ts, Email.ts)",
    USE_DTO_SUFFIX: "Use *Dto, *Request, or *Response suffix (e.g., UserResponseDto.ts)",
    USE_VERB_NOUN: "Use verb + noun in PascalCase (e.g., CreateUser.ts, UpdateProfile.ts)",
    USE_CASE_START_VERB: "Use cases should start with a verb",
} as const
