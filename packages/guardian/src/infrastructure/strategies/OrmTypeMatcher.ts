import { ORM_QUERY_METHODS } from "../constants/orm-methods"
import { REPOSITORY_PATTERN_MESSAGES } from "../../domain/constants/Messages"

/**
 * Matches and validates ORM-specific types and patterns
 *
 * Identifies ORM-specific types (Prisma, TypeORM, Mongoose, etc.)
 * that should not appear in domain layer repository interfaces.
 */
export class OrmTypeMatcher {
    private readonly ormTypePatterns = [
        /Prisma\./,
        /PrismaClient/,
        /TypeORM/,
        /@Entity/,
        /@Column/,
        /@PrimaryColumn/,
        /@PrimaryGeneratedColumn/,
        /@ManyToOne/,
        /@OneToMany/,
        /@ManyToMany/,
        /@JoinColumn/,
        /@JoinTable/,
        /Mongoose\./,
        /Schema/,
        /Model</,
        /Document/,
        /Sequelize\./,
        /DataTypes\./,
        /FindOptions/,
        /WhereOptions/,
        /IncludeOptions/,
        /QueryInterface/,
        /MikroORM/,
        /EntityManager/,
        /EntityRepository/,
        /Collection</,
    ]

    /**
     * Checks if a type name is an ORM-specific type
     */
    public isOrmType(typeName: string): boolean {
        return this.ormTypePatterns.some((pattern) => pattern.test(typeName))
    }

    /**
     * Extracts ORM type name from a code line
     */
    public extractOrmType(line: string): string {
        for (const pattern of this.ormTypePatterns) {
            const match = line.match(pattern)
            if (match) {
                const startIdx = match.index || 0
                const typeMatch = /[\w.]+/.exec(line.slice(startIdx))
                return typeMatch ? typeMatch[0] : REPOSITORY_PATTERN_MESSAGES.UNKNOWN_TYPE
            }
        }
        return REPOSITORY_PATTERN_MESSAGES.UNKNOWN_TYPE
    }

    /**
     * Checks if a method name is a technical ORM method
     */
    public isTechnicalMethod(methodName: string): boolean {
        return (ORM_QUERY_METHODS as readonly string[]).includes(methodName)
    }
}
