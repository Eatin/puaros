/**
 * BAD EXAMPLE: Naming Convention Violations
 *
 * Guardian should detect:
 * ❌ File name: user.ts (should be PascalCase: User.ts)
 * ❌ Location: application layer use case should start with verb
 *
 * Why bad:
 * - Inconsistent naming
 * - Hard to find files
 * - Not following Clean Architecture conventions
 */

export class user {
    constructor(
        public id: string,
        public email: string,
    ) {}
}

/**
 * ✅ GOOD VERSION:
 *
 * // domain/entities/User.ts - PascalCase entity
 * export class User { ... }
 *
 * // application/use-cases/CreateUser.ts - Verb+Noun
 * export class CreateUser { ... }
 */
