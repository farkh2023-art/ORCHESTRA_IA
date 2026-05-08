import { describe, expect, it } from "vitest";
import { buildEdges, buildNodes, computeDepths } from "@/components/dag/dagUtils";
import type { DagTaskInput } from "@/components/dag/dagUtils";

const TASKS: DagTaskInput[] = [
  { id: "a", role: "COORDINATOR", status: "DONE", dependsOn: [] },
  { id: "b", role: "ANALYST", status: "RUNNING", dependsOn: ["a"] },
  { id: "c", role: "RESEARCHER", status: "PENDING", dependsOn: ["a"] },
  { id: "d", role: "WRITER", status: "PENDING", dependsOn: ["b", "c"] },
];

// ── computeDepths ────────────────────────────────────────────────────────────

describe("computeDepths", () => {
  it("depth 0 pour les noeuds racines (aucun dependsOn)", () => {
    const depths = computeDepths(TASKS);
    expect(depths.get("a")).toBe(0);
  });

  it("depth 1 pour les noeuds dépendant d'une racine", () => {
    const depths = computeDepths(TASKS);
    expect(depths.get("b")).toBe(1);
    expect(depths.get("c")).toBe(1);
  });

  it("depth 2 pour un noeud dépendant de depth 1", () => {
    const depths = computeDepths(TASKS);
    expect(depths.get("d")).toBe(2);
  });

  it("toutes les tasks sans dépendances ont depth 0", () => {
    const tasks: DagTaskInput[] = [
      { id: "x", role: "A", status: "PENDING", dependsOn: [] },
      { id: "y", role: "B", status: "PENDING", dependsOn: [] },
    ];
    const depths = computeDepths(tasks);
    expect(depths.get("x")).toBe(0);
    expect(depths.get("y")).toBe(0);
  });

  it("ignore une dépendance vers un id inconnu (depth reste 0)", () => {
    const tasks: DagTaskInput[] = [
      { id: "z", role: "A", status: "PENDING", dependsOn: ["unknown"] },
    ];
    const depths = computeDepths(tasks);
    expect(depths.get("z")).toBe(1); // unknown → depth 0, z → 0 + 1 = 1
  });

  it("résiste aux cycles (guard anti-boucle infinie)", () => {
    const cyclic: DagTaskInput[] = [
      { id: "p", role: "A", status: "PENDING", dependsOn: ["q"] },
      { id: "q", role: "B", status: "PENDING", dependsOn: ["p"] },
    ];
    expect(() => computeDepths(cyclic)).not.toThrow();
  });
});

// ── buildNodes ───────────────────────────────────────────────────────────────

describe("buildNodes", () => {
  it("retourne tableau vide pour 0 tasks (état vide DAG)", () => {
    expect(buildNodes([])).toEqual([]);
  });

  it("retourne N nodes pour N tasks", () => {
    expect(buildNodes(TASKS)).toHaveLength(TASKS.length);
  });

  it("chaque node a un id, une position et un type taskNode", () => {
    for (const node of buildNodes(TASKS)) {
      expect(node.id).toBeTruthy();
      expect(node.type).toBe("taskNode");
      expect(typeof node.position.x).toBe("number");
      expect(typeof node.position.y).toBe("number");
    }
  });

  it("les noeuds racines ont x = 0 (première colonne)", () => {
    const nodes = buildNodes(TASKS);
    const rootNode = nodes.find((n) => n.id === "a");
    expect(rootNode?.position.x).toBe(0);
  });

  it("les noeuds de depth > 0 ont x > 0", () => {
    const nodes = buildNodes(TASKS);
    const depNode = nodes.find((n) => n.id === "b");
    expect(depNode!.position.x).toBeGreaterThan(0);
  });

  it("les noeuds de même depth ont le même x", () => {
    const nodes = buildNodes(TASKS);
    const b = nodes.find((n) => n.id === "b")!;
    const c = nodes.find((n) => n.id === "c")!;
    expect(b.position.x).toBe(c.position.x);
  });

  it("chaque node porte role et status dans data", () => {
    const nodes = buildNodes([TASKS[0]]);
    expect(nodes[0].data.role).toBe("COORDINATOR");
    expect(nodes[0].data.status).toBe("DONE");
  });
});

// ── buildEdges ───────────────────────────────────────────────────────────────

describe("buildEdges", () => {
  it("retourne 0 edges si aucun dependsOn", () => {
    const tasks: DagTaskInput[] = [
      { id: "a", role: "A", status: "PENDING", dependsOn: [] },
    ];
    expect(buildEdges(tasks)).toEqual([]);
  });

  it("retourne autant d'edges que de dépendances déclarées", () => {
    // a→b, a→c, b→d, c→d = 4
    expect(buildEdges(TASKS)).toHaveLength(4);
  });

  it("edge va du parent vers l'enfant (source → target)", () => {
    const tasks: DagTaskInput[] = [
      { id: "a", role: "A", status: "DONE", dependsOn: [] },
      { id: "b", role: "B", status: "PENDING", dependsOn: ["a"] },
    ];
    const edges = buildEdges(tasks);
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe("a");
    expect(edges[0].target).toBe("b");
  });

  it("les edges proviennent de Task.dependsOn[]", () => {
    const tasks: DagTaskInput[] = [
      { id: "x", role: "X", status: "DONE", dependsOn: [] },
      { id: "y", role: "Y", status: "PENDING", dependsOn: ["x"] },
      { id: "z", role: "Z", status: "PENDING", dependsOn: ["x", "y"] },
    ];
    const edges = buildEdges(tasks);
    expect(edges).toHaveLength(3); // x→y, x→z, y→z
    const sources = edges.map((e) => e.source);
    expect(sources).toContain("x");
    expect(sources).toContain("y");
  });

  it("ignore les dépendances vers des ids inconnus", () => {
    const tasks: DagTaskInput[] = [
      { id: "a", role: "A", status: "PENDING", dependsOn: ["inexistant"] },
    ];
    expect(buildEdges(tasks)).toHaveLength(0);
  });

  it("chaque edge a un id unique", () => {
    const edges = buildEdges(TASKS);
    const ids = edges.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
