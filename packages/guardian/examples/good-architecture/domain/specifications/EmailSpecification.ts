import { Specification } from "./Specification"
import { Email } from "../value-objects/Email"

/**
 * Email Domain Specification
 *
 * Business Rule: Check if email is from corporate domain
 */
export class CorporateEmailSpecification extends Specification<Email> {
    private static readonly CORPORATE_DOMAINS = ["company.com", "corp.company.com"]

    public isSatisfiedBy(email: Email): boolean {
        const domain = email.getDomain()
        return CorporateEmailSpecification.CORPORATE_DOMAINS.includes(domain)
    }
}

/**
 * Email Blacklist Specification
 *
 * Business Rule: Check if email domain is blacklisted
 */
export class BlacklistedEmailSpecification extends Specification<Email> {
    private static readonly BLACKLISTED_DOMAINS = [
        "tempmail.com",
        "throwaway.email",
        "guerrillamail.com",
    ]

    public isSatisfiedBy(email: Email): boolean {
        const domain = email.getDomain()
        return BlacklistedEmailSpecification.BLACKLISTED_DOMAINS.includes(domain)
    }
}

/**
 * Valid Email for Registration
 *
 * Composed specification: not blacklisted
 */
export class ValidEmailForRegistrationSpecification extends Specification<Email> {
    private readonly notBlacklisted: Specification<Email>

    constructor() {
        super()
        this.notBlacklisted = new BlacklistedEmailSpecification().not()
    }

    public isSatisfiedBy(email: Email): boolean {
        return this.notBlacklisted.isSatisfiedBy(email)
    }
}
