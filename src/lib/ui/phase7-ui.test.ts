import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Phase 7 UI contracts", () => {
  it("landing expose ORCHESTRA_IA et le CTA projet", () => {
    const source = read("src/app/page.tsx");
    expect(source).toContain("ORCHESTRA_IA");
    expect(source).toContain("/projects/new");
  });

  it("registry est chargeable et utilise AgentRegistryGrid", () => {
    const source = read("src/app/registry/page.tsx");
    expect(source).toContain("AgentRegistryGrid");
    expect(source).toContain("Catalogue des agents noyau");
  });

  it("les badges couvrent les statuts HITL et DONE", () => {
    expect(read("src/components/projects/ProjectStatusBadge.tsx")).toContain("WAITING_HUMAN");
    expect(read("src/components/dag/TaskStatusBadge.tsx")).toContain("DONE");
  });

  it("ProjectDagFlow conserve le contrat DagTask avec dependsOn et le heading", () => {
    const source = read("src/components/dag/ProjectDagFlow.tsx");
    expect(source).toContain("export type DagTask");
    expect(source).toContain("dependsOn");
    expect(source).toContain("DAG execution");
  });

  it("ProjectDagFlow - fallback état vide avec message plan d'exécution", () => {
    const source = read("src/components/dag/ProjectDagFlow.tsx");
    expect(source).toContain("Le DAG sera affiché après validation du plan d'exécution.");
  });

  it("ProjectDagFlow - intègre React Flow via buildNodes, buildEdges et ReactFlow", () => {
    const source = read("src/components/dag/ProjectDagFlow.tsx");
    expect(source).toContain("buildNodes");
    expect(source).toContain("buildEdges");
    expect(source).toContain("ReactFlow");
    expect(source).toContain("nodeTypes");
  });

  it("TaskNode affiche le statut via TaskStatusBadge et a des handles source/target", () => {
    const source = read("src/components/dag/TaskNode.tsx");
    expect(source).toContain("TaskStatusBadge");
    expect(source).toContain("status");
    expect(source).toContain("Handle");
    expect(source).toContain("Position.Left");
    expect(source).toContain("Position.Right");
  });

  it("dagUtils exporte computeDepths, buildNodes et buildEdges", () => {
    const source = read("src/components/dag/dagUtils.ts");
    expect(source).toContain("export function computeDepths");
    expect(source).toContain("export function buildNodes");
    expect(source).toContain("export function buildEdges");
    expect(source).toContain("dependsOn");
  });
});
