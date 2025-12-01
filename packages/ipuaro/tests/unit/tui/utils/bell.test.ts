/**
 * Tests for bell utility.
 */

import { describe, expect, it, vi } from "vitest"
import { ringBell } from "../../../../src/tui/utils/bell.js"

describe("ringBell", () => {
    it("should write bell character to stdout", () => {
        const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

        ringBell()

        expect(writeSpy).toHaveBeenCalledWith("\u0007")
        writeSpy.mockRestore()
    })

    it("should write correct ASCII bell character", () => {
        const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)

        ringBell()

        const callArg = writeSpy.mock.calls[0]?.[0]
        expect(callArg).toBe("\u0007")
        expect(callArg?.charCodeAt(0)).toBe(7)

        writeSpy.mockRestore()
    })
})
