/**
 * TUI types and interfaces.
 */

import type { HandleMessageStatus } from "../application/use-cases/HandleMessage.js"

/**
 * TUI status - maps to HandleMessageStatus.
 */
export type TuiStatus = HandleMessageStatus

/**
 * Git branch information.
 */
export interface BranchInfo {
    name: string
    isDetached: boolean
}

/**
 * Props for the main App component.
 */
export interface AppProps {
    projectPath: string
    autoApply?: boolean
    model?: string
}

/**
 * Status bar display data.
 */
export interface StatusBarData {
    contextUsage: number
    projectName: string
    branch: BranchInfo
    sessionTime: string
    status: TuiStatus
}
