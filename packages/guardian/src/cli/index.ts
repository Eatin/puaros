#!/usr/bin/env node
import { Command } from "commander"
import { analyzeProject } from "../api"
import { version } from "../../package.json"
import {
    CLI_ARGUMENTS,
    CLI_COMMANDS,
    CLI_DESCRIPTIONS,
    CLI_LABELS,
    CLI_MESSAGES,
    CLI_OPTIONS,
    DEFAULT_EXCLUDES,
} from "./constants"
import { SEVERITY_LEVELS, SEVERITY_ORDER, type SeverityLevel } from "../shared/constants"

const SEVERITY_LABELS: Record<SeverityLevel, string> = {
    [SEVERITY_LEVELS.CRITICAL]: "🔴 CRITICAL",
    [SEVERITY_LEVELS.HIGH]: "🟠 HIGH",
    [SEVERITY_LEVELS.MEDIUM]: "🟡 MEDIUM",
    [SEVERITY_LEVELS.LOW]: "🟢 LOW",
}

const SEVERITY_HEADER: Record<SeverityLevel, string> = {
    [SEVERITY_LEVELS.CRITICAL]:
        "\n═══════════════════════════════════════════\n🔴 CRITICAL SEVERITY\n═══════════════════════════════════════════",
    [SEVERITY_LEVELS.HIGH]:
        "\n═══════════════════════════════════════════\n🟠 HIGH SEVERITY\n═══════════════════════════════════════════",
    [SEVERITY_LEVELS.MEDIUM]:
        "\n═══════════════════════════════════════════\n🟡 MEDIUM SEVERITY\n═══════════════════════════════════════════",
    [SEVERITY_LEVELS.LOW]:
        "\n═══════════════════════════════════════════\n🟢 LOW SEVERITY\n═══════════════════════════════════════════",
}

function groupBySeverity<T extends { severity: SeverityLevel }>(
    violations: T[],
): Map<SeverityLevel, T[]> {
    const grouped = new Map<SeverityLevel, T[]>()

    for (const violation of violations) {
        const existing = grouped.get(violation.severity) || []
        existing.push(violation)
        grouped.set(violation.severity, existing)
    }

    return grouped
}

function filterBySeverity<T extends { severity: SeverityLevel }>(
    violations: T[],
    minSeverity?: SeverityLevel,
): T[] {
    if (!minSeverity) {
        return violations
    }

    const minSeverityOrder = SEVERITY_ORDER[minSeverity]
    return violations.filter((v) => SEVERITY_ORDER[v.severity] <= minSeverityOrder)
}

function displayGroupedViolations<T extends { severity: SeverityLevel }>(
    violations: T[],
    displayFn: (v: T, index: number) => void,
): void {
    const grouped = groupBySeverity(violations)
    const severities: SeverityLevel[] = [
        SEVERITY_LEVELS.CRITICAL,
        SEVERITY_LEVELS.HIGH,
        SEVERITY_LEVELS.MEDIUM,
        SEVERITY_LEVELS.LOW,
    ]

    for (const severity of severities) {
        const items = grouped.get(severity)
        if (items && items.length > 0) {
            console.log(SEVERITY_HEADER[severity])
            console.log(`Found ${String(items.length)} issue(s)\n`)
            items.forEach(displayFn)
        }
    }
}

const program = new Command()

program.name(CLI_COMMANDS.NAME).description(CLI_DESCRIPTIONS.MAIN).version(version)

program
    .command(CLI_COMMANDS.CHECK)
    .description(CLI_DESCRIPTIONS.CHECK)
    .argument(CLI_ARGUMENTS.PATH, CLI_DESCRIPTIONS.PATH_ARG)
    .option(CLI_OPTIONS.EXCLUDE, CLI_DESCRIPTIONS.EXCLUDE_OPTION, [...DEFAULT_EXCLUDES])
    .option(CLI_OPTIONS.VERBOSE, CLI_DESCRIPTIONS.VERBOSE_OPTION, false)
    .option(CLI_OPTIONS.NO_HARDCODE, CLI_DESCRIPTIONS.NO_HARDCODE_OPTION)
    .option(CLI_OPTIONS.NO_ARCHITECTURE, CLI_DESCRIPTIONS.NO_ARCHITECTURE_OPTION)
    .option(CLI_OPTIONS.MIN_SEVERITY, CLI_DESCRIPTIONS.MIN_SEVERITY_OPTION)
    .option(CLI_OPTIONS.ONLY_CRITICAL, CLI_DESCRIPTIONS.ONLY_CRITICAL_OPTION, false)
    .action(async (path: string, options) => {
        try {
            console.log(CLI_MESSAGES.ANALYZING)

            const result = await analyzeProject({
                rootDir: path,
                exclude: options.exclude,
            })

            let {
                hardcodeViolations,
                violations,
                circularDependencyViolations,
                namingViolations,
                frameworkLeakViolations,
                entityExposureViolations,
                dependencyDirectionViolations,
                repositoryPatternViolations,
                metrics,
            } = result

            const minSeverity: SeverityLevel | undefined = options.onlyCritical
                ? SEVERITY_LEVELS.CRITICAL
                : options.minSeverity
                  ? (options.minSeverity.toLowerCase() as SeverityLevel)
                  : undefined

            if (minSeverity) {
                violations = filterBySeverity(violations, minSeverity)
                hardcodeViolations = filterBySeverity(hardcodeViolations, minSeverity)
                circularDependencyViolations = filterBySeverity(
                    circularDependencyViolations,
                    minSeverity,
                )
                namingViolations = filterBySeverity(namingViolations, minSeverity)
                frameworkLeakViolations = filterBySeverity(frameworkLeakViolations, minSeverity)
                entityExposureViolations = filterBySeverity(entityExposureViolations, minSeverity)
                dependencyDirectionViolations = filterBySeverity(
                    dependencyDirectionViolations,
                    minSeverity,
                )
                repositoryPatternViolations = filterBySeverity(
                    repositoryPatternViolations,
                    minSeverity,
                )

                if (options.onlyCritical) {
                    console.log("\n🔴 Filtering: Showing only CRITICAL severity issues\n")
                } else {
                    console.log(
                        `\n⚠️  Filtering: Showing ${minSeverity.toUpperCase()} severity and above\n`,
                    )
                }
            }

            // Display metrics
            console.log(CLI_MESSAGES.METRICS_HEADER)
            console.log(`   ${CLI_LABELS.FILES_ANALYZED} ${String(metrics.totalFiles)}`)
            console.log(`   ${CLI_LABELS.TOTAL_FUNCTIONS} ${String(metrics.totalFunctions)}`)
            console.log(`   ${CLI_LABELS.TOTAL_IMPORTS} ${String(metrics.totalImports)}`)

            if (Object.keys(metrics.layerDistribution).length > 0) {
                console.log(CLI_MESSAGES.LAYER_DISTRIBUTION_HEADER)
                for (const [layer, count] of Object.entries(metrics.layerDistribution)) {
                    console.log(`   ${layer}: ${String(count)} ${CLI_LABELS.FILES}`)
                }
            }

            // Architecture violations
            if (options.architecture && violations.length > 0) {
                console.log(
                    `\n${CLI_MESSAGES.VIOLATIONS_HEADER} ${String(violations.length)} ${CLI_LABELS.ARCHITECTURE_VIOLATIONS}`,
                )

                displayGroupedViolations(violations, (v, index) => {
                    console.log(`${String(index + 1)}. ${v.file}`)
                    console.log(`   Severity: ${SEVERITY_LABELS[v.severity]}`)
                    console.log(`   Rule: ${v.rule}`)
                    console.log(`   ${v.message}`)
                    console.log("")
                })
            }

            // Circular dependency violations
            if (options.architecture && circularDependencyViolations.length > 0) {
                console.log(
                    `\n${CLI_MESSAGES.CIRCULAR_DEPS_HEADER} ${String(circularDependencyViolations.length)} ${CLI_LABELS.CIRCULAR_DEPENDENCIES}`,
                )

                displayGroupedViolations(circularDependencyViolations, (cd, index) => {
                    console.log(`${String(index + 1)}. ${cd.message}`)
                    console.log(`   Severity: ${SEVERITY_LABELS[cd.severity]}`)
                    console.log("   Cycle path:")
                    cd.cycle.forEach((file, i) => {
                        console.log(`     ${String(i + 1)}. ${file}`)
                    })
                    console.log(
                        `     ${String(cd.cycle.length + 1)}. ${cd.cycle[0]} (back to start)`,
                    )
                    console.log("")
                })
            }

            // Naming convention violations
            if (options.architecture && namingViolations.length > 0) {
                console.log(
                    `\n${CLI_MESSAGES.NAMING_VIOLATIONS_HEADER} ${String(namingViolations.length)} ${CLI_LABELS.NAMING_VIOLATIONS}`,
                )

                displayGroupedViolations(namingViolations, (nc, index) => {
                    console.log(`${String(index + 1)}. ${nc.file}`)
                    console.log(`   Severity: ${SEVERITY_LABELS[nc.severity]}`)
                    console.log(`   File: ${nc.fileName}`)
                    console.log(`   Layer: ${nc.layer}`)
                    console.log(`   Type: ${nc.type}`)
                    console.log(`   Message: ${nc.message}`)
                    if (nc.suggestion) {
                        console.log(`   💡 Suggestion: ${nc.suggestion}`)
                    }
                    console.log("")
                })
            }

            // Framework leak violations
            if (options.architecture && frameworkLeakViolations.length > 0) {
                console.log(
                    `\n🏗️ Found ${String(frameworkLeakViolations.length)} framework leak(s)`,
                )

                displayGroupedViolations(frameworkLeakViolations, (fl, index) => {
                    console.log(`${String(index + 1)}. ${fl.file}`)
                    console.log(`   Severity: ${SEVERITY_LABELS[fl.severity]}`)
                    console.log(`   Package: ${fl.packageName}`)
                    console.log(`   Category: ${fl.categoryDescription}`)
                    console.log(`   Layer: ${fl.layer}`)
                    console.log(`   Rule: ${fl.rule}`)
                    console.log(`   ${fl.message}`)
                    console.log(`   💡 Suggestion: ${fl.suggestion}`)
                    console.log("")
                })
            }

            // Entity exposure violations
            if (options.architecture && entityExposureViolations.length > 0) {
                console.log(
                    `\n🎭 Found ${String(entityExposureViolations.length)} entity exposure(s)`,
                )

                displayGroupedViolations(entityExposureViolations, (ee, index) => {
                    const location = ee.line ? `${ee.file}:${String(ee.line)}` : ee.file
                    console.log(`${String(index + 1)}. ${location}`)
                    console.log(`   Severity: ${SEVERITY_LABELS[ee.severity]}`)
                    console.log(`   Entity: ${ee.entityName}`)
                    console.log(`   Return Type: ${ee.returnType}`)
                    if (ee.methodName) {
                        console.log(`   Method: ${ee.methodName}`)
                    }
                    console.log(`   Layer: ${ee.layer}`)
                    console.log(`   Rule: ${ee.rule}`)
                    console.log(`   ${ee.message}`)
                    console.log("   💡 Suggestion:")
                    ee.suggestion.split("\n").forEach((line) => {
                        if (line.trim()) {
                            console.log(`      ${line}`)
                        }
                    })
                    console.log("")
                })
            }

            // Dependency direction violations
            if (options.architecture && dependencyDirectionViolations.length > 0) {
                console.log(
                    `\n⚠️ Found ${String(dependencyDirectionViolations.length)} dependency direction violation(s)`,
                )

                displayGroupedViolations(dependencyDirectionViolations, (dd, index) => {
                    console.log(`${String(index + 1)}. ${dd.file}`)
                    console.log(`   Severity: ${SEVERITY_LABELS[dd.severity]}`)
                    console.log(`   From Layer: ${dd.fromLayer}`)
                    console.log(`   To Layer: ${dd.toLayer}`)
                    console.log(`   Import: ${dd.importPath}`)
                    console.log(`   ${dd.message}`)
                    console.log(`   💡 Suggestion: ${dd.suggestion}`)
                    console.log("")
                })
            }

            // Repository pattern violations
            if (options.architecture && repositoryPatternViolations.length > 0) {
                console.log(
                    `\n📦 Found ${String(repositoryPatternViolations.length)} repository pattern violation(s)`,
                )

                displayGroupedViolations(repositoryPatternViolations, (rp, index) => {
                    console.log(`${String(index + 1)}. ${rp.file}`)
                    console.log(`   Severity: ${SEVERITY_LABELS[rp.severity]}`)
                    console.log(`   Layer: ${rp.layer}`)
                    console.log(`   Type: ${rp.violationType}`)
                    console.log(`   Details: ${rp.details}`)
                    console.log(`   ${rp.message}`)
                    console.log(`   💡 Suggestion: ${rp.suggestion}`)
                    console.log("")
                })
            }

            // Hardcode violations
            if (options.hardcode && hardcodeViolations.length > 0) {
                console.log(
                    `\n${CLI_MESSAGES.HARDCODE_VIOLATIONS_HEADER} ${String(hardcodeViolations.length)} ${CLI_LABELS.HARDCODE_VIOLATIONS}`,
                )

                displayGroupedViolations(hardcodeViolations, (hc, index) => {
                    console.log(
                        `${String(index + 1)}. ${hc.file}:${String(hc.line)}:${String(hc.column)}`,
                    )
                    console.log(`   Severity: ${SEVERITY_LABELS[hc.severity]}`)
                    console.log(`   Type: ${hc.type}`)
                    console.log(`   Value: ${JSON.stringify(hc.value)}`)
                    console.log(`   Context: ${hc.context.trim()}`)
                    console.log(`   💡 Suggested: ${hc.suggestion.constantName}`)
                    console.log(`   📁 Location: ${hc.suggestion.location}`)
                    console.log("")
                })
            }

            // Summary
            const totalIssues =
                violations.length +
                hardcodeViolations.length +
                circularDependencyViolations.length +
                namingViolations.length +
                frameworkLeakViolations.length +
                entityExposureViolations.length +
                dependencyDirectionViolations.length +
                repositoryPatternViolations.length

            if (totalIssues === 0) {
                console.log(CLI_MESSAGES.NO_ISSUES)
                process.exit(0)
            } else {
                console.log(
                    `${CLI_MESSAGES.ISSUES_TOTAL} ${String(totalIssues)} ${CLI_LABELS.ISSUES_TOTAL}`,
                )
                console.log(CLI_MESSAGES.TIP)

                if (options.verbose) {
                    console.log(CLI_MESSAGES.HELP_FOOTER)
                }

                process.exit(1)
            }
        } catch (error) {
            console.error(`\n❌ ${CLI_MESSAGES.ERROR_PREFIX}`)
            console.error(error instanceof Error ? error.message : String(error))
            console.error("")
            process.exit(1)
        }
    })

program.parse()
