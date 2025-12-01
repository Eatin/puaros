/**
 * Theme color utilities for TUI.
 */

export type Theme = "dark" | "light"

/**
 * Color scheme for a theme.
 */
export interface ColorScheme {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    info: string
    muted: string
    background: string
    foreground: string
}

/**
 * Dark theme color scheme (default).
 */
const DARK_THEME: ColorScheme = {
    primary: "cyan",
    secondary: "blue",
    success: "green",
    warning: "yellow",
    error: "red",
    info: "cyan",
    muted: "gray",
    background: "black",
    foreground: "white",
}

/**
 * Light theme color scheme.
 */
const LIGHT_THEME: ColorScheme = {
    primary: "blue",
    secondary: "cyan",
    success: "green",
    warning: "yellow",
    error: "red",
    info: "blue",
    muted: "gray",
    background: "white",
    foreground: "black",
}

/**
 * Get color scheme for a theme.
 */
export function getColorScheme(theme: Theme): ColorScheme {
    return theme === "dark" ? DARK_THEME : LIGHT_THEME
}

/**
 * Get color for a status.
 */
export function getStatusColor(
    status: "ready" | "thinking" | "error" | "tool_call" | "awaiting_confirmation",
    theme: Theme = "dark",
): string {
    const scheme = getColorScheme(theme)

    switch (status) {
        case "ready":
            return scheme.success
        case "thinking":
        case "tool_call":
            return scheme.warning
        case "awaiting_confirmation":
            return scheme.info
        case "error":
            return scheme.error
    }
}

/**
 * Get color for a message role.
 */
export function getRoleColor(
    role: "user" | "assistant" | "system" | "tool",
    theme: Theme = "dark",
): string {
    const scheme = getColorScheme(theme)

    switch (role) {
        case "user":
            return scheme.success
        case "assistant":
            return scheme.primary
        case "system":
            return scheme.muted
        case "tool":
            return scheme.secondary
    }
}

/**
 * Get color for context usage percentage.
 */
export function getContextColor(usage: number, theme: Theme = "dark"): string {
    const scheme = getColorScheme(theme)

    if (usage >= 0.8) {
        return scheme.error
    }
    if (usage >= 0.6) {
        return scheme.warning
    }
    return scheme.success
}
