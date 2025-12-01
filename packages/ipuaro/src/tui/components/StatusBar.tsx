/**
 * StatusBar component for TUI.
 * Displays: [ipuaro] [ctx: 12%] [project: myapp] [main] [47m] status
 */

import { Box, Text } from "ink"
import type React from "react"
import type { BranchInfo, TuiStatus } from "../types.js"

export interface StatusBarProps {
    contextUsage: number
    projectName: string
    branch: BranchInfo
    sessionTime: string
    status: TuiStatus
}

function getStatusIndicator(status: TuiStatus): { text: string; color: string } {
    switch (status) {
        case "ready": {
            return { text: "ready", color: "green" }
        }
        case "thinking": {
            return { text: "thinking...", color: "yellow" }
        }
        case "tool_call": {
            return { text: "executing...", color: "cyan" }
        }
        case "awaiting_confirmation": {
            return { text: "confirm?", color: "magenta" }
        }
        case "error": {
            return { text: "error", color: "red" }
        }
        default: {
            return { text: "ready", color: "green" }
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
}: StatusBarProps): React.JSX.Element {
    const statusIndicator = getStatusIndicator(status)
    const branchDisplay = branch.isDetached ? `HEAD@${branch.name.slice(0, 7)}` : branch.name

    return (
        <Box borderStyle="single" borderColor="gray" paddingX={1} justifyContent="space-between">
            <Box gap={1}>
                <Text color="cyan" bold>
                    [ipuaro]
                </Text>
                <Text color="gray">
                    [ctx:{" "}
                    <Text color={contextUsage > 0.8 ? "red" : "white"}>
                        {formatContextUsage(contextUsage)}
                    </Text>
                    ]
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
