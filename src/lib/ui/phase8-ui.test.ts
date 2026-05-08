import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string): string {
  return readFileSync(path, "utf8");
}

describe("Phase 8 UI contracts", () => {
  it("le dashboard projet utilise le polling pour rafraîchir DAG, coûts, timeline et HITL", () => {
    const source = read("src/components/projects/ProjectLiveDashboard.tsx");
    expect(source).toContain("useProjectStatus");
    expect(source).toContain("ProjectDagFlow");
    expect(source).toContain("CostPanel");
    expect(source).toContain("MessageTimeline");
    expect(source).toContain("HitlConsole");
  });

  it("le hook suspend le polling quand l'onglet est caché", () => {
    const source = read("src/hooks/useProjectStatus.ts");
    expect(source).toContain("setInterval");
    expect(source).toContain("4_000");
    expect(source).toContain("document.visibilityState === \"visible\"");
  });

  it("les badges couvrent les statuts de task attendus en temps réel", () => {
    const source = read("src/components/dag/TaskStatusBadge.tsx");
    for (const status of ["PENDING", "QUEUED", "RUNNING", "DONE", "FAILED", "WAITING_HUMAN", "CANCELLED"]) {
      expect(source).toContain(status);
    }
  });
});
