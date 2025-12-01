/**
 * CLI commands module.
 */

export { executeStart, type StartOptions, type StartResult } from "./start.js"
export { executeInit, type InitOptions, type InitResult } from "./init.js"
export { executeIndex, type IndexResult, type IndexProgressCallback } from "./index-cmd.js"
export {
    runOnboarding,
    checkRedis,
    checkOllama,
    checkModel,
    checkProjectSize,
    pullModel,
    type OnboardingResult,
    type OnboardingOptions,
} from "./onboarding.js"
export { registerAllTools } from "./tools-setup.js"
