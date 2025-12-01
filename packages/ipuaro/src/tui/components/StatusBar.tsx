/**
 * StatusBar component for TUI.
 * Displays: [ipuaro] [ctx: 12%] [project: myapp] [main] [47m] status
 */

import { Box, Text } from "ink"
import type React from "react"
import type { BranchInfo, TuiStatus } from "../types.js"
import { getContextColor, getStatusColor, type Theme } from "../utils/theme.js"

export interface StatusBarProps {
    contextUsage: number
    projectName: string
    branch: BranchInfo
    sessionTime: string
    status: TuiStatus
    theme?: Theme
}

function getStatusIndicator(status: TuiStatus, theme: Theme): { text: string; color: string } {
    const color = getStatusColor(status, theme)

    switch (status) {
        case "ready": {
            return { text: "ready", color }
        }
        case "thinking": {
            return { text: "thinking...", color }
        }
        case "tool_call": {
            return { text: "executing...", color }
        }
        case "awaiting_confirmation": {
            return { text: "confirm?", color }
        }
        case "error": {
            return { text: "error", color }
        }
        default: {
            return { text: "ready", color }
        }
    }
}

function formatContextUsage(usage: number): string {
    return `${String(Math.round(usage * 100))}%`
}

export function StatusBar({
    contextUsage,
    projectName,
    branch,
    sessionTime,
    status,
    theme = "dark",
}: StatusBarProps): React.JSX.Element {
    const statusIndicator = getStatusIndicator(status, theme)
    const branchDisplay = branch.isDetached ? `HEAD@${branch.name.slice(0, 7)}` : branch.name
    const contextColor = getContextColor(contextUsage, theme)

    return (
        <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
            <Box gap={1}>
                <Text color="cyan" bold>
                    [ipuaro]
                </Text>
                <Text color="gray">
                    [ctx: <Text color={contextColor}>{formatContextUsage(contextUsage)}</Text>]
                </Text>
                <Text color="gray">
                    [<Text color="blue">{projectName}</Text>]
                </Text>
                <Text color="gray">
                    [<Text color="green">{branchDisplay}</Text>]
                </Text>
                <Text color="gray">
                    [<Text color="white">{sessionTime}</Text>]
                </Text>
            </Box>
            <Text color={statusIndicator.color}>{statusIndicator.text}</Text>
        </Box>
    )
}
