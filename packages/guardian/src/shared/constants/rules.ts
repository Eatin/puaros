/**
 * Rule names for code analysis
 */
export const RULES = {
    CLEAN_ARCHITECTURE: "clean-architecture",
    HARDCODED_VALUE: "hardcoded-value",
    CIRCULAR_DEPENDENCY: "circular-dependency",
    NAMING_CONVENTION: "naming-convention",
} as const

/**
 * Hardcode types
 */
export const HARDCODE_TYPES = {
    MAGIC_NUMBER: "magic-number",
    MAGIC_STRING: "magic-string",
    MAGIC_CONFIG: "magic-config",
} as const

/**
 * Layer names
 */
export const LAYERS = {
    DOMAIN: "domain",
    APPLICATION: "application",
    INFRASTRUCTURE: "infrastructure",
    SHARED: "shared",
} as const

/**
 * Naming convention violation types
 */
export const NAMING_VIOLATION_TYPES = {
    WRONG_SUFFIX: "wrong-suffix",
    WRONG_PREFIX: "wrong-prefix",
    WRONG_CASE: "wrong-case",
    FORBIDDEN_PATTERN: "forbidden-pattern",
    WRONG_VERB_NOUN: "wrong-verb-noun",
} as const

/**
 * Naming patterns for each layer
 */
export const NAMING_PATTERNS = {
    DOMAIN: {
        ENTITY: {
            pattern: /^[A-Z][a-zA-Z0-9]*\.ts$/,
            description: "PascalCase noun (User.ts, Order.ts)",
            forbidden: ["Dto", "Request", "Response", "Controller"],
        },
        SERVICE: {
            pattern: /^[A-Z][a-zA-Z0-9]*Service\.ts$/,
            description: "*Service suffix (UserService.ts)",
        },
        VALUE_OBJECT: {
            pattern: /^[A-Z][a-zA-Z0-9]*\.ts$/,
            description: "PascalCase noun (Email.ts, Money.ts)",
        },
        REPOSITORY_INTERFACE: {
            pattern: /^I[A-Z][a-zA-Z0-9]*Repository\.ts$/,
            description: "I*Repository prefix (IUserRepository.ts)",
        },
    },
    APPLICATION: {
        USE_CASE: {
            pattern: /^[A-Z][a-z]+[A-Z][a-zA-Z0-9]*\.ts$/,
            description: "Verb in PascalCase (CreateUser.ts, UpdateProfile.ts)",
            examples: ["CreateUser.ts", "UpdateProfile.ts", "DeleteOrder.ts"],
        },
        DTO: {
            pattern: /^[A-Z][a-zA-Z0-9]*(Dto|Request|Response)\.ts$/,
            description: "*Dto, *Request, *Response suffix",
            examples: ["UserResponseDto.ts", "CreateUserRequest.ts"],
        },
        MAPPER: {
            pattern: /^[A-Z][a-zA-Z0-9]*Mapper\.ts$/,
            description: "*Mapper suffix (UserMapper.ts)",
        },
    },
    INFRASTRUCTURE: {
        CONTROLLER: {
            pattern: /^[A-Z][a-zA-Z0-9]*Controller\.ts$/,
            description: "*Controller suffix (UserController.ts)",
        },
        REPOSITORY_IMPL: {
            pattern: /^[A-Z][a-zA-Z0-9]*Repository\.ts$/,
            description: "*Repository suffix (PrismaUserRepository.ts, MongoUserRepository.ts)",
        },
        SERVICE: {
            pattern: /^[A-Z][a-zA-Z0-9]*(Service|Adapter)\.ts$/,
            description: "*Service or *Adapter suffix (EmailService.ts, S3StorageAdapter.ts)",
        },
    },
} as const

/**
 * Common verbs for use cases
 */
export const USE_CASE_VERBS = [
    "Analyze",
    "Create",
    "Update",
    "Delete",
    "Get",
    "Find",
    "List",
    "Search",
    "Validate",
    "Calculate",
    "Generate",
    "Send",
    "Fetch",
    "Process",
    "Execute",
    "Handle",
    "Register",
    "Authenticate",
    "Authorize",
    "Import",
    "Export",
    "Place",
    "Cancel",
    "Approve",
    "Reject",
    "Confirm",
] as const
