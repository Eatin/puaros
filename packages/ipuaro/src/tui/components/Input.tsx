/**
 * Input component for TUI.
 * Prompt with history navigation (up/down) and path autocomplete (tab).
 */

import { Box, Text, useInput } from "ink"
import TextInput from "ink-text-input"
import React, { useCallback, useState } from "react"

export interface InputProps {
    onSubmit: (text: string) => void
    history: string[]
    disabled: boolean
    placeholder?: string
}

export function Input({
    onSubmit,
    history,
    disabled,
    placeholder = "Type a message...",
}: InputProps): React.JSX.Element {
    const [value, setValue] = useState("")
    const [historyIndex, setHistoryIndex] = useState(-1)
    const [savedInput, setSavedInput] = useState("")

    const handleChange = useCallback((newValue: string) => {
        setValue(newValue)
        setHistoryIndex(-1)
    }, [])

    const handleSubmit = useCallback(
        (text: string) => {
            if (disabled || !text.trim()) {
                return
            }
            onSubmit(text)
            setValue("")
            setHistoryIndex(-1)
            setSavedInput("")
        },
        [disabled, onSubmit],
    )

    useInput(
        (input, key) => {
            if (disabled) {
                return
            }

            if (key.upArrow && history.length > 0) {
                if (historyIndex === -1) {
                    setSavedInput(value)
                }

                const newIndex =
                    historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1)
                setHistoryIndex(newIndex)
                setValue(history[newIndex] ?? "")
            }

            if (key.downArrow) {
                if (historyIndex === -1) {
                    return
                }

                if (historyIndex >= history.length - 1) {
                    setHistoryIndex(-1)
                    setValue(savedInput)
                } else {
                    const newIndex = historyIndex + 1
                    setHistoryIndex(newIndex)
                    setValue(history[newIndex] ?? "")
                }
            }
        },
        { isActive: !disabled },
    )

    return (
        <Box borderStyle="single" borderColor={disabled ? "gray" : "cyan"} paddingX={1}>
            <Text color={disabled ? "gray" : "green"} bold>
                {">"}{" "}
            </Text>
            {disabled ? (
                <Text color="gray" dimColor>
                    {placeholder}
                </Text>
            ) : (
                <TextInput
                    value={value}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    placeholder={placeholder}
                />
            )}
        </Box>
    )
}
