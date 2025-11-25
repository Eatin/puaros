import { describe, it, expect } from "vitest"
import { analyzeProject } from "../../src/api"
import path from "path"
import type {
    AnalyzeProjectResponse,
    HardcodeViolation,
    CircularDependencyViolation,
    NamingConventionViolation,
    FrameworkLeakViolation,
    EntityExposureViolation,
    DependencyDirectionViolation,
    RepositoryPatternViolation,
    AggregateBoundaryViolation,
} from "../../src/api"

describe("JSON Output Format E2E", () => {
    const EXAMPLES_DIR = path.join(__dirname, "../../examples")

    describe("Response Structure", () => {
        it("should return valid JSON structure", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "good-architecture")

            const result = await analyzeProject({ rootDir })

            expect(result).toBeDefined()
            expect(typeof result).toBe("object")

            const json = JSON.stringify(result)
            expect(() => JSON.parse(json)).not.toThrow()
        })

        it("should include all required top-level fields", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "good-architecture")

            const result: AnalyzeProjectResponse = await analyzeProject({ rootDir })

            expect(result).toHaveProperty("hardcodeViolations")
            expect(result).toHaveProperty("violations")
            expect(result).toHaveProperty("circularDependencyViolations")
            expect(result).toHaveProperty("namingViolations")
            expect(result).toHaveProperty("frameworkLeakViolations")
            expect(result).toHaveProperty("entityExposureViolations")
            expect(result).toHaveProperty("dependencyDirectionViolations")
            expect(result).toHaveProperty("repositoryPatternViolations")
            expect(result).toHaveProperty("aggregateBoundaryViolations")
            expect(result).toHaveProperty("metrics")
            expect(result).toHaveProperty("dependencyGraph")
        })

        it("should have correct types for all fields", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "good-architecture")

            const result = await analyzeProject({ rootDir })

            expect(Array.isArray(result.hardcodeViolations)).toBe(true)
            expect(Array.isArray(result.violations)).toBe(true)
            expect(Array.isArray(result.circularDependencyViolations)).toBe(true)
            expect(Array.isArray(result.namingViolations)).toBe(true)
            expect(Array.isArray(result.frameworkLeakViolations)).toBe(true)
            expect(Array.isArray(result.entityExposureViolations)).toBe(true)
            expect(Array.isArray(result.dependencyDirectionViolations)).toBe(true)
            expect(Array.isArray(result.repositoryPatternViolations)).toBe(true)
            expect(Array.isArray(result.aggregateBoundaryViolations)).toBe(true)
            expect(typeof result.metrics).toBe("object")
            expect(typeof result.dependencyGraph).toBe("object")
        })
    })

    describe("Metrics Structure", () => {
        it("should include all metric fields", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "good-architecture")

            const result = await analyzeProject({ rootDir })
            const { metrics } = result

            expect(metrics).toHaveProperty("totalFiles")
            expect(metrics).toHaveProperty("totalFunctions")
            expect(metrics).toHaveProperty("totalImports")
            expect(metrics).toHaveProperty("layerDistribution")

            expect(typeof metrics.totalFiles).toBe("number")
            expect(typeof metrics.totalFunctions).toBe("number")
            expect(typeof metrics.totalImports).toBe("number")
            expect(typeof metrics.layerDistribution).toBe("object")
        })

        it("should have non-negative metric values", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "good-architecture")

            const result = await analyzeProject({ rootDir })
            const { metrics } = result

            expect(metrics.totalFiles).toBeGreaterThanOrEqual(0)
            expect(metrics.totalFunctions).toBeGreaterThanOrEqual(0)
            expect(metrics.totalImports).toBeGreaterThanOrEqual(0)
        })
    })

    describe("Hardcode Violation Structure", () => {
        it("should have correct structure for hardcode violations", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "bad-architecture/hardcoded")

            const result = await analyzeProject({ rootDir })

            if (result.hardcodeViolations.length > 0) {
                const violation: HardcodeViolation = result.hardcodeViolations[0]

                expect(violation).toHaveProperty("file")
                expect(violation).toHaveProperty("line")
                expect(violation).toHaveProperty("column")
                expect(violation).toHaveProperty("type")
                expect(violation).toHaveProperty("value")
                expect(violation).toHaveProperty("context")
                expect(violation).toHaveProperty("suggestion")
                expect(violation).toHaveProperty("severity")

                expect(typeof violation.file).toBe("string")
                expect(typeof violation.line).toBe("number")
                expect(typeof violation.column).toBe("number")
                expect(typeof violation.type).toBe("string")
                expect(typeof violation.context).toBe("string")
                expect(typeof violation.severity).toBe("string")
            }
        })
    })

    describe("Circular Dependency Violation Structure", () => {
        it("should have correct structure for circular dependency violations", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "bad-architecture/circular")

            const result = await analyzeProject({ rootDir })

            if (result.circularDependencyViolations.length > 0) {
                const violation: CircularDependencyViolation =
                    result.circularDependencyViolations[0]

                expect(violation).toHaveProperty("file")
                expect(violation).toHaveProperty("cycle")
                expect(violation).toHaveProperty("severity")

                expect(typeof violation.file).toBe("string")
                expect(Array.isArray(violation.cycle)).toBe(true)
                expect(violation.cycle.length).toBeGreaterThanOrEqual(2)
                expect(typeof violation.severity).toBe("string")
                expect(violation.severity).toBe("critical")
            }
        })
    })

    describe("Naming Convention Violation Structure", () => {
        it("should have correct structure for naming violations", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "bad-architecture/naming")

            const result = await analyzeProject({ rootDir })

            if (result.namingViolations.length > 0) {
                const violation: NamingConventionViolation = result.namingViolations[0]

                expect(violation).toHaveProperty("file")
                expect(violation).toHaveProperty("fileName")
                expect(violation).toHaveProperty("expected")
                expect(violation).toHaveProperty("actual")
                expect(violation).toHaveProperty("layer")
                expect(violation).toHaveProperty("message")
                expect(violation).toHaveProperty("severity")

                expect(typeof violation.file).toBe("string")
                expect(typeof violation.fileName).toBe("string")
                expect(typeof violation.expected).toBe("string")
                expect(typeof violation.actual).toBe("string")
                expect(typeof violation.layer).toBe("string")
                expect(typeof violation.message).toBe("string")
                expect(typeof violation.severity).toBe("string")
            }
        })
    })

    describe("Framework Leak Violation Structure", () => {
        it("should have correct structure for framework leak violations", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "bad-architecture/framework-leaks")

            const result = await analyzeProject({ rootDir })

            if (result.frameworkLeakViolations.length > 0) {
                const violation: FrameworkLeakViolation = result.frameworkLeakViolations[0]

                expect(violation).toHaveProperty("file")
                expect(violation).toHaveProperty("packageName")
                expect(violation).toHaveProperty("category")
                expect(violation).toHaveProperty("categoryDescription")
                expect(violation).toHaveProperty("layer")
                expect(violation).toHaveProperty("message")
                expect(violation).toHaveProperty("suggestion")
                expect(violation).toHaveProperty("severity")

                expect(typeof violation.file).toBe("string")
                expect(typeof violation.packageName).toBe("string")
                expect(typeof violation.category).toBe("string")
                expect(typeof violation.categoryDescription).toBe("string")
                expect(typeof violation.layer).toBe("string")
                expect(typeof violation.message).toBe("string")
                expect(typeof violation.suggestion).toBe("string")
                expect(typeof violation.severity).toBe("string")
            }
        })
    })

    describe("Entity Exposure Violation Structure", () => {
        it("should have correct structure for entity exposure violations", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "bad-architecture/entity-exposure")

            const result = await analyzeProject({ rootDir })

            if (result.entityExposureViolations.length > 0) {
                const violation: EntityExposureViolation = result.entityExposureViolations[0]

                expect(violation).toHaveProperty("file")
                expect(violation).toHaveProperty("entityName")
                expect(violation).toHaveProperty("returnType")
                expect(violation).toHaveProperty("suggestion")
                expect(violation).toHaveProperty("severity")

                expect(typeof violation.file).toBe("string")
                expect(typeof violation.entityName).toBe("string")
                expect(typeof violation.returnType).toBe("string")
                expect(typeof violation.suggestion).toBe("string")
                expect(typeof violation.severity).toBe("string")
            }
        })
    })

    describe("Dependency Direction Violation Structure", () => {
        it("should have correct structure for dependency direction violations", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "bad-architecture/dependency-direction")

            const result = await analyzeProject({ rootDir })

            if (result.dependencyDirectionViolations.length > 0) {
                const violation: DependencyDirectionViolation =
                    result.dependencyDirectionViolations[0]

                expect(violation).toHaveProperty("file")
                expect(violation).toHaveProperty("fromLayer")
                expect(violation).toHaveProperty("toLayer")
                expect(violation).toHaveProperty("importPath")
                expect(violation).toHaveProperty("suggestion")
                expect(violation).toHaveProperty("severity")

                expect(typeof violation.file).toBe("string")
                expect(typeof violation.fromLayer).toBe("string")
                expect(typeof violation.toLayer).toBe("string")
                expect(typeof violation.importPath).toBe("string")
                expect(typeof violation.suggestion).toBe("string")
                expect(typeof violation.severity).toBe("string")
            }
        })
    })

    describe("Repository Pattern Violation Structure", () => {
        it("should have correct structure for repository pattern violations", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "repository-pattern")

            const result = await analyzeProject({ rootDir })

            const badViolations = result.repositoryPatternViolations.filter((v) =>
                v.file.includes("bad"),
            )

            if (badViolations.length > 0) {
                const violation: RepositoryPatternViolation = badViolations[0]

                expect(violation).toHaveProperty("file")
                expect(violation).toHaveProperty("line")
                expect(violation).toHaveProperty("violationType")
                expect(violation).toHaveProperty("details")
                expect(violation).toHaveProperty("suggestion")
                expect(violation).toHaveProperty("severity")

                expect(typeof violation.file).toBe("string")
                expect(typeof violation.line).toBe("number")
                expect(typeof violation.violationType).toBe("string")
                expect(typeof violation.details).toBe("string")
                expect(typeof violation.suggestion).toBe("string")
                expect(typeof violation.severity).toBe("string")
            }
        })
    })

    describe("Aggregate Boundary Violation Structure", () => {
        it("should have correct structure for aggregate boundary violations", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "aggregate-boundary/bad")

            const result = await analyzeProject({ rootDir })

            if (result.aggregateBoundaryViolations.length > 0) {
                const violation: AggregateBoundaryViolation = result.aggregateBoundaryViolations[0]

                expect(violation).toHaveProperty("file")
                expect(violation).toHaveProperty("fromAggregate")
                expect(violation).toHaveProperty("toAggregate")
                expect(violation).toHaveProperty("entityName")
                expect(violation).toHaveProperty("importPath")
                expect(violation).toHaveProperty("suggestion")
                expect(violation).toHaveProperty("severity")

                expect(typeof violation.file).toBe("string")
                expect(typeof violation.fromAggregate).toBe("string")
                expect(typeof violation.toAggregate).toBe("string")
                expect(typeof violation.entityName).toBe("string")
                expect(typeof violation.importPath).toBe("string")
                expect(typeof violation.suggestion).toBe("string")
                expect(typeof violation.severity).toBe("string")
            }
        })
    })

    describe("Dependency Graph Structure", () => {
        it("should have dependency graph object", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "good-architecture")

            const result = await analyzeProject({ rootDir })
            const { dependencyGraph } = result

            expect(dependencyGraph).toBeDefined()
            expect(typeof dependencyGraph).toBe("object")
        })

        it("should have getAllNodes method on dependency graph", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "good-architecture")

            const result = await analyzeProject({ rootDir })
            const { dependencyGraph } = result

            expect(typeof dependencyGraph.getAllNodes).toBe("function")
            const nodes = dependencyGraph.getAllNodes()
            expect(Array.isArray(nodes)).toBe(true)
        })
    })

    describe("JSON Serialization", () => {
        it("should serialize metrics without data loss", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "good-architecture")

            const result = await analyzeProject({ rootDir })

            const json = JSON.stringify(result.metrics)
            const parsed = JSON.parse(json)

            expect(parsed.totalFiles).toBe(result.metrics.totalFiles)
            expect(parsed.totalFunctions).toBe(result.metrics.totalFunctions)
            expect(parsed.totalImports).toBe(result.metrics.totalImports)
        })

        it("should serialize violations without data loss", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "good-architecture")

            const result = await analyzeProject({ rootDir })

            const json = JSON.stringify({
                hardcodeViolations: result.hardcodeViolations,
                violations: result.violations,
            })
            const parsed = JSON.parse(json)

            expect(Array.isArray(parsed.violations)).toBe(true)
            expect(Array.isArray(parsed.hardcodeViolations)).toBe(true)
        })

        it("should serialize violation arrays for large results", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const result = await analyzeProject({ rootDir })

            const json = JSON.stringify({
                hardcodeViolations: result.hardcodeViolations,
                violations: result.violations,
                namingViolations: result.namingViolations,
            })

            expect(json.length).toBeGreaterThan(0)
            expect(() => JSON.parse(json)).not.toThrow()
        })
    })

    describe("Severity Levels", () => {
        it("should only contain valid severity levels", async () => {
            const rootDir = path.join(EXAMPLES_DIR, "bad-architecture")

            const result = await analyzeProject({ rootDir })

            const validSeverities = ["critical", "high", "medium", "low"]

            const allViolations = [
                ...result.hardcodeViolations,
                ...result.violations,
                ...result.circularDependencyViolations,
                ...result.namingViolations,
                ...result.frameworkLeakViolations,
                ...result.entityExposureViolations,
                ...result.dependencyDirectionViolations,
                ...result.repositoryPatternViolations,
                ...result.aggregateBoundaryViolations,
            ]

            allViolations.forEach((violation) => {
                if ("severity" in violation) {
                    expect(validSeverities).toContain(violation.severity)
                }
            })
        })
    })
})
