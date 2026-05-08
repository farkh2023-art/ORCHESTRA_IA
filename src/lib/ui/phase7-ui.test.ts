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

  it("ProjectDagFlow accepte des tasks mock via son contrat DagTask", () => {
    const source = read("src/components/dag/ProjectDagFlow.tsx");
    expect(source).toContain("export type DagTask");
    expect(source).toContain("dependsOn");
    expect(source).toContain("DAG execution");
  });
});
