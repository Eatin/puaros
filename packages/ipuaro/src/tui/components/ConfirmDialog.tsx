/**
 * ConfirmDialog component for TUI.
 * Displays a confirmation dialog with [Y] Apply / [N] Cancel / [E] Edit options.
 */

import { Box, Text, useInput } from "ink"
import React, { useState } from "react"
import type { ConfirmChoice } from "../../shared/types/index.js"
import { DiffView, type DiffViewProps } from "./DiffView.js"

export interface ConfirmDialogProps {
    message: string
    diff?: DiffViewProps
    onSelect: (choice: ConfirmChoice) => void
}

function ChoiceButton({
    hotkey,
    label,
    isSelected,
}: {
    hotkey: string
    label: string
    isSelected: boolean
}): React.JSX.Element {
    return (
        <Box>
            <Text color={isSelected ? "cyan" : "gray"}>
                [<Text bold>{hotkey}</Text>] {label}
            </Text>
        </Box>
    )
}

export function ConfirmDialog({ message, diff, onSelect }: ConfirmDialogProps): React.JSX.Element {
    const [selected, setSelected] = useState<ConfirmChoice | null>(null)

    useInput((input, key) => {
        const lowerInput = input.toLowerCase()

        if (lowerInput === "y") {
            setSelected("apply")
            onSelect("apply")
        } else if (lowerInput === "n") {
            setSelected("cancel")
            onSelect("cancel")
        } else if (lowerInput === "e") {
            setSelected("edit")
            onSelect("edit")
        } else if (key.escape) {
            setSelected("cancel")
            onSelect("cancel")
        }
    })

    return (
        <Box
            flexDirection="column"
            borderStyle="round"
            borderColor="yellow"
            paddingX={1}
            paddingY={1}
        >
            <Box marginBottom={1}>
                <Text color="yellow" bold>
                    ⚠ {message}
                </Text>
            </Box>

            {diff && (
                <Box marginBottom={1}>
                    <DiffView {...diff} />
                </Box>
            )}

            <Box gap={2}>
                <ChoiceButton hotkey="Y" label="Apply" isSelected={selected === "apply"} />
                <ChoiceButton hotkey="N" label="Cancel" isSelected={selected === "cancel"} />
                <ChoiceButton hotkey="E" label="Edit" isSelected={selected === "edit"} />
            </Box>
        </Box>
    )
}
