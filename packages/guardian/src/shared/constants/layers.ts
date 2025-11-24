export const LAYER_DOMAIN = "domain"
export const LAYER_APPLICATION = "application"
export const LAYER_INFRASTRUCTURE = "infrastructure"
export const LAYER_SHARED = "shared"
export const LAYER_CLI = "cli"

export const LAYERS = [
    LAYER_DOMAIN,
    LAYER_APPLICATION,
    LAYER_INFRASTRUCTURE,
    LAYER_SHARED,
    LAYER_CLI,
] as const

export type Layer = (typeof LAYERS)[number]
