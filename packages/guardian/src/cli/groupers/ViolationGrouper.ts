import { SEVERITY_ORDER, type SeverityLevel } from "../../shared/constants"

export class ViolationGrouper {
    groupBySeverity<T extends { severity: SeverityLevel }>(
        violations: T[],
    ): Map<SeverityLevel, T[]> {
        const grouped = new Map<SeverityLevel, T[]>()

        for (const violation of violations) {
            const existing = grouped.get(violation.severity) ?? []
            existing.push(violation)
            grouped.set(violation.severity, existing)
        }

        return grouped
    }

    filterBySeverity<T extends { severity: SeverityLevel }>(
        violations: T[],
        minSeverity?: SeverityLevel,
    ): T[] {
        if (!minSeverity) {
            return violations
        }

        const minSeverityOrder = SEVERITY_ORDER[minSeverity]
        return violations.filter((v) => SEVERITY_ORDER[v.severity] <= minSeverityOrder)
    }
}
