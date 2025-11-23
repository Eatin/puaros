import { User } from "../aggregates/User"
import { Email } from "../value-objects/Email"
import { UserId } from "../value-objects/UserId"

/**
 * Factory: UserFactory
 *
 * DDD Pattern: Factory
 * - Encapsulates complex object creation
 * - Hides construction details
 * - Can create from different sources
 *
 * SOLID Principles:
 * - SRP: responsible only for creating Users
 * - OCP: can add new creation methods
 * - DIP: returns domain object, not DTO
 *
 * Use cases:
 * - Create from external auth provider (OAuth, SAML)
 * - Create from legacy data
 * - Create with default values
 * - Create test users
 */
export class UserFactory {
    /**
     * Create user from OAuth provider data
     */
    public static createFromOAuth(
        oauthEmail: string,
        oauthFirstName: string,
        oauthLastName: string,
    ): User {
        const email = Email.create(oauthEmail)

        const firstName = oauthFirstName.trim() || "Unknown"
        const lastName = oauthLastName.trim() || "User"

        return User.create(email, firstName, lastName)
    }

    /**
     * Create user from legacy database format
     */
    public static createFromLegacy(legacyData: {
        id: string
        email: string
        full_name: string
        active: number
        created_timestamp: number
    }): User {
        const [firstName = "Unknown", lastName = "User"] = legacyData.full_name.split(" ")

        const userId = UserId.create(legacyData.id)
        const email = Email.create(legacyData.email)
        const isActive = legacyData.active === 1
        const registeredAt = new Date(legacyData.created_timestamp * 1000)

        return User.reconstitute(userId, email, firstName, lastName, isActive, false, registeredAt)
    }

    /**
     * Create test user with defaults
     */
    public static createTestUser(emailSuffix: string = "test"): User {
        const email = Email.create(`test-${Date.now()}@${emailSuffix}.com`)
        return User.create(email, "Test", "User")
    }

    /**
     * Create admin user
     */
    public static createAdmin(email: Email, firstName: string, lastName: string): User {
        const user = User.create(email, firstName, lastName)
        user.activate()
        return user
    }
}
