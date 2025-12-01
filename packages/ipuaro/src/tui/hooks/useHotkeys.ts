/**
 * useHotkeys hook for TUI.
 * Handles global keyboard shortcuts.
 */

import { useInput } from "ink"
import { useCallback, useRef } from "react"

export interface HotkeyHandlers {
    onInterrupt?: () => void
    onExit?: () => void
    onUndo?: () => void
}

export interface UseHotkeysOptions {
    enabled?: boolean
}

export function useHotkeys(handlers: HotkeyHandlers, options: UseHotkeysOptions = {}): void {
    const { enabled = true } = options
    const interruptCount = useRef(0)
    const interruptTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const resetInterruptCount = useCallback((): void => {
        interruptCount.current = 0
        if (interruptTimer.current) {
            clearTimeout(interruptTimer.current)
            interruptTimer.current = null
        }
    }, [])

    useInput(
        (_input, key) => {
            if (key.ctrl && _input === "c") {
                interruptCount.current++

                if (interruptCount.current === 1) {
                    handlers.onInterrupt?.()

                    interruptTimer.current = setTimeout(() => {
                        resetInterruptCount()
                    }, 1000)
                } else if (interruptCount.current >= 2) {
                    resetInterruptCount()
                    handlers.onExit?.()
                }
            }

            if (key.ctrl && _input === "d") {
                handlers.onExit?.()
            }

            if (key.ctrl && _input === "z") {
                handlers.onUndo?.()
            }
        },
        { isActive: enabled },
    )
}
