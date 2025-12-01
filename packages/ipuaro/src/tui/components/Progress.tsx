/**
 * Progress component for TUI.
 * Displays a progress bar: [=====>    ] 45% (120/267 files)
 */

import { Box, Text } from "ink"
import type React from "react"

export interface ProgressProps {
    current: number
    total: number
    label: string
    width?: number
}

function calculatePercentage(current: number, total: number): number {
    if (total === 0) {
        return 0
    }
    return Math.min(100, Math.round((current / total) * 100))
}

function createProgressBar(percentage: number, width: number): { filled: string; empty: string } {
    const filledWidth = Math.round((percentage / 100) * width)
    const emptyWidth = width - filledWidth

    const filled = "=".repeat(Math.max(0, filledWidth - 1)) + (filledWidth > 0 ? ">" : "")
    const empty = " ".repeat(Math.max(0, emptyWidth))

    return { filled, empty }
}

function getProgressColor(percentage: number): string {
    if (percentage >= 100) {
        return "green"
    }
    if (percentage >= 50) {
        return "yellow"
    }
    return "cyan"
}

export function Progress({ current, total, label, width = 30 }: ProgressProps): React.JSX.Element {
    const percentage = calculatePercentage(current, total)
    const { filled, empty } = createProgressBar(percentage, width)
    const color = getProgressColor(percentage)

    return (
        <Box gap={1}>
            <Text color="gray">[</Text>
            <Text color={color}>{filled}</Text>
            <Text color="gray">{empty}</Text>
            <Text color="gray">]</Text>
            <Text color={color} bold>
                {String(percentage)}%
            </Text>
            <Text color="gray">
                ({String(current)}/{String(total)} {label})
            </Text>
        </Box>
    )
}
