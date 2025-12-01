/**
 * Bell notification utility for terminal.
 */

/**
 * Ring the terminal bell.
 * Works by outputting the ASCII bell character (\u0007).
 */
export function ringBell(): void {
    process.stdout.write("\u0007")
}
