import { CLI_LABELS, CLI_MESSAGES } from "../constants"

interface ProjectMetrics {
    totalFiles: number
    totalFunctions: number
    totalImports: number
    layerDistribution: Record<string, number>
}

export class StatisticsFormatter {
    displayMetrics(metrics: ProjectMetrics): void {
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
    }

    displaySummary(totalIssues: number, verbose: boolean): void {
        if (totalIssues === 0) {
            console.log(CLI_MESSAGES.NO_ISSUES)
            process.exit(0)
        } else {
            console.log(
                `${CLI_MESSAGES.ISSUES_TOTAL} ${String(totalIssues)} ${CLI_LABELS.ISSUES_TOTAL}`,
            )
            console.log(CLI_MESSAGES.TIP)

            if (verbose) {
                console.log(CLI_MESSAGES.HELP_FOOTER)
            }

            process.exit(1)
        }
    }

    displaySeverityFilterMessage(onlyCritical: boolean, minSeverity?: string): void {
        if (onlyCritical) {
            console.log("\n🔴 Filtering: Showing only CRITICAL severity issues\n")
        } else if (minSeverity) {
            console.log(
                `\n⚠️  Filtering: Showing ${minSeverity.toUpperCase()} severity and above\n`,
            )
        }
    }

    displayError(message: string): void {
        console.error(`\n❌ ${CLI_MESSAGES.ERROR_PREFIX}`)
        console.error(message)
        console.error("")
        process.exit(1)
    }
}
