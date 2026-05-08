export type DagTaskInput = {
  id: string;
  role: string;
  status: string;
  dependsOn: string[];
};

export type FlowNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { role: string; status: string };
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  type: string;
};

const COL_SPACING = 240;
const ROW_SPACING = 110;

export function computeDepths(tasks: DagTaskInput[]): Map<string, number> {
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const memo = new Map<string, number>();

  function depth(id: string, visiting = new Set<string>()): number {
    if (memo.has(id)) return memo.get(id)!;
    if (visiting.has(id)) return 0; // cycle guard
    visiting.add(id);
    const task = taskById.get(id);
    if (!task || task.dependsOn.length === 0) {
      memo.set(id, 0);
      return 0;
    }
    const maxDep = Math.max(
      ...task.dependsOn.map((depId) =>
        taskById.has(depId) ? depth(depId, new Set(visiting)) : 0
      )
    );
    const d = maxDep + 1;
    memo.set(id, d);
    return d;
  }

  tasks.forEach((t) => depth(t.id));
  return memo;
}

export function buildNodes(tasks: DagTaskInput[]): FlowNode[] {
  if (tasks.length === 0) return [];

  const depths = computeDepths(tasks);
  const byDepth = new Map<number, DagTaskInput[]>();

  for (const task of tasks) {
    const d = depths.get(task.id) ?? 0;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(task);
  }

  const nodes: FlowNode[] = [];
  for (const [col, colTasks] of byDepth) {
    colTasks.forEach((task, rowIdx) => {
      nodes.push({
        id: task.id,
        type: "taskNode",
        position: { x: col * COL_SPACING, y: rowIdx * ROW_SPACING },
        data: { role: task.role, status: task.status },
      });
    });
  }
  return nodes;
}

export function buildEdges(tasks: DagTaskInput[]): FlowEdge[] {
  const taskIds = new Set(tasks.map((t) => t.id));
  const edges: FlowEdge[] = [];

  for (const task of tasks) {
    for (const depId of task.dependsOn) {
      if (taskIds.has(depId)) {
        edges.push({
          id: `${depId}->${task.id}`,
          source: depId,
          target: task.id,
          type: "smoothstep",
        });
      }
    }
  }
  return edges;
}
