import { describe, it, expect } from "vitest"
import { DependencyGraph } from "../../../src/domain/entities/DependencyGraph"
import { SourceFile } from "../../../src/domain/entities/SourceFile"
import { ProjectPath } from "../../../src/domain/value-objects/ProjectPath"

describe("DependencyGraph", () => {
    describe("basic operations", () => {
        it("should create an empty dependency graph", () => {
            const graph = new DependencyGraph()
            expect(graph.getAllNodes()).toHaveLength(0)
        })

        it("should add a file to the graph", () => {
            const graph = new DependencyGraph()
            const path = ProjectPath.create("/project/src/file.ts", "/project")
            const file = new SourceFile(path, "const x = 1")

            graph.addFile(file)

            expect(graph.getAllNodes()).toHaveLength(1)
            expect(graph.getNode("src/file.ts")).toBeDefined()
        })

        it("should add dependencies between files", () => {
            const graph = new DependencyGraph()
            const path1 = ProjectPath.create("/project/src/file1.ts", "/project")
            const path2 = ProjectPath.create("/project/src/file2.ts", "/project")
            const file1 = new SourceFile(path1, "import { x } from './file2'")
            const file2 = new SourceFile(path2, "export const x = 1")

            graph.addFile(file1)
            graph.addFile(file2)
            graph.addDependency("src/file1.ts", "src/file2.ts")

            const node1 = graph.getNode("src/file1.ts")
            expect(node1?.dependencies).toContain("src/file2.ts")

            const node2 = graph.getNode("src/file2.ts")
            expect(node2?.dependents).toContain("src/file1.ts")
        })

        it("should get metrics", () => {
            const graph = new DependencyGraph()
            const path1 = ProjectPath.create("/project/src/file1.ts", "/project")
            const path2 = ProjectPath.create("/project/src/file2.ts", "/project")
            const file1 = new SourceFile(path1, "")
            const file2 = new SourceFile(path2, "")

            graph.addFile(file1)
            graph.addFile(file2)
            graph.addDependency("src/file1.ts", "src/file2.ts")

            const metrics = graph.getMetrics()
            expect(metrics.totalFiles).toBe(2)
            expect(metrics.totalDependencies).toBe(1)
        })
    })

    describe("findCycles", () => {
        it("should return empty array when no cycles exist", () => {
            const graph = new DependencyGraph()
            const path1 = ProjectPath.create("/project/src/a.ts", "/project")
            const path2 = ProjectPath.create("/project/src/b.ts", "/project")
            const path3 = ProjectPath.create("/project/src/c.ts", "/project")

            const fileA = new SourceFile(path1, "")
            const fileB = new SourceFile(path2, "")
            const fileC = new SourceFile(path3, "")

            graph.addFile(fileA)
            graph.addFile(fileB)
            graph.addFile(fileC)

            graph.addDependency("src/a.ts", "src/b.ts")
            graph.addDependency("src/b.ts", "src/c.ts")

            const cycles = graph.findCycles()
            expect(cycles).toHaveLength(0)
        })

        it("should detect simple two-file cycle (A → B → A)", () => {
            const graph = new DependencyGraph()
            const pathA = ProjectPath.create("/project/src/a.ts", "/project")
            const pathB = ProjectPath.create("/project/src/b.ts", "/project")

            const fileA = new SourceFile(pathA, "import { b } from './b'")
            const fileB = new SourceFile(pathB, "import { a } from './a'")

            graph.addFile(fileA)
            graph.addFile(fileB)
            graph.addDependency("src/a.ts", "src/b.ts")
            graph.addDependency("src/b.ts", "src/a.ts")

            const cycles = graph.findCycles()
            expect(cycles.length).toBeGreaterThan(0)

            const cycle = cycles[0]
            expect(cycle).toContain("src/a.ts")
            expect(cycle).toContain("src/b.ts")
        })

        it("should detect three-file cycle (A → B → C → A)", () => {
            const graph = new DependencyGraph()
            const pathA = ProjectPath.create("/project/src/a.ts", "/project")
            const pathB = ProjectPath.create("/project/src/b.ts", "/project")
            const pathC = ProjectPath.create("/project/src/c.ts", "/project")

            const fileA = new SourceFile(pathA, "")
            const fileB = new SourceFile(pathB, "")
            const fileC = new SourceFile(pathC, "")

            graph.addFile(fileA)
            graph.addFile(fileB)
            graph.addFile(fileC)

            graph.addDependency("src/a.ts", "src/b.ts")
            graph.addDependency("src/b.ts", "src/c.ts")
            graph.addDependency("src/c.ts", "src/a.ts")

            const cycles = graph.findCycles()
            expect(cycles.length).toBeGreaterThan(0)

            const cycle = cycles[0]
            expect(cycle).toContain("src/a.ts")
            expect(cycle).toContain("src/b.ts")
            expect(cycle).toContain("src/c.ts")
        })

        it("should detect longer cycles (A → B → C → D → A)", () => {
            const graph = new DependencyGraph()
            const pathA = ProjectPath.create("/project/src/a.ts", "/project")
            const pathB = ProjectPath.create("/project/src/b.ts", "/project")
            const pathC = ProjectPath.create("/project/src/c.ts", "/project")
            const pathD = ProjectPath.create("/project/src/d.ts", "/project")

            const fileA = new SourceFile(pathA, "")
            const fileB = new SourceFile(pathB, "")
            const fileC = new SourceFile(pathC, "")
            const fileD = new SourceFile(pathD, "")

            graph.addFile(fileA)
            graph.addFile(fileB)
            graph.addFile(fileC)
            graph.addFile(fileD)

            graph.addDependency("src/a.ts", "src/b.ts")
            graph.addDependency("src/b.ts", "src/c.ts")
            graph.addDependency("src/c.ts", "src/d.ts")
            graph.addDependency("src/d.ts", "src/a.ts")

            const cycles = graph.findCycles()
            expect(cycles.length).toBeGreaterThan(0)

            const cycle = cycles[0]
            expect(cycle.length).toBe(4)
            expect(cycle).toContain("src/a.ts")
            expect(cycle).toContain("src/b.ts")
            expect(cycle).toContain("src/c.ts")
            expect(cycle).toContain("src/d.ts")
        })

        it("should detect multiple independent cycles", () => {
            const graph = new DependencyGraph()

            const pathA = ProjectPath.create("/project/src/a.ts", "/project")
            const pathB = ProjectPath.create("/project/src/b.ts", "/project")
            const pathC = ProjectPath.create("/project/src/c.ts", "/project")
            const pathD = ProjectPath.create("/project/src/d.ts", "/project")

            const fileA = new SourceFile(pathA, "")
            const fileB = new SourceFile(pathB, "")
            const fileC = new SourceFile(pathC, "")
            const fileD = new SourceFile(pathD, "")

            graph.addFile(fileA)
            graph.addFile(fileB)
            graph.addFile(fileC)
            graph.addFile(fileD)

            graph.addDependency("src/a.ts", "src/b.ts")
            graph.addDependency("src/b.ts", "src/a.ts")

            graph.addDependency("src/c.ts", "src/d.ts")
            graph.addDependency("src/d.ts", "src/c.ts")

            const cycles = graph.findCycles()
            expect(cycles.length).toBeGreaterThanOrEqual(2)
        })

        it("should handle complex graph with cycle and acyclic parts", () => {
            const graph = new DependencyGraph()

            const pathA = ProjectPath.create("/project/src/a.ts", "/project")
            const pathB = ProjectPath.create("/project/src/b.ts", "/project")
            const pathC = ProjectPath.create("/project/src/c.ts", "/project")
            const pathD = ProjectPath.create("/project/src/d.ts", "/project")

            const fileA = new SourceFile(pathA, "")
            const fileB = new SourceFile(pathB, "")
            const fileC = new SourceFile(pathC, "")
            const fileD = new SourceFile(pathD, "")

            graph.addFile(fileA)
            graph.addFile(fileB)
            graph.addFile(fileC)
            graph.addFile(fileD)

            graph.addDependency("src/a.ts", "src/b.ts")
            graph.addDependency("src/b.ts", "src/a.ts")

            graph.addDependency("src/c.ts", "src/d.ts")

            const cycles = graph.findCycles()
            expect(cycles.length).toBeGreaterThan(0)

            const cycle = cycles[0]
            expect(cycle).toContain("src/a.ts")
            expect(cycle).toContain("src/b.ts")
            expect(cycle).not.toContain("src/c.ts")
            expect(cycle).not.toContain("src/d.ts")
        })

        it("should handle single file without dependencies", () => {
            const graph = new DependencyGraph()
            const path = ProjectPath.create("/project/src/a.ts", "/project")
            const file = new SourceFile(path, "")

            graph.addFile(file)

            const cycles = graph.findCycles()
            expect(cycles).toHaveLength(0)
        })
    })
})
