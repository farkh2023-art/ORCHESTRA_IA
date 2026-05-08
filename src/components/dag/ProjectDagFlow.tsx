"use client";

import "@xyflow/react/dist/style.css";
import { Background, Controls, MarkerType, ReactFlow } from "@xyflow/react";
import type { Edge, Node, NodeTypes } from "@xyflow/react";
import { useMemo } from "react";
import { SavoirCard } from "@/components/savoir/SavoirCard";
import { TaskNode } from "./TaskNode";
import { buildEdges, buildNodes } from "./dagUtils";

export type DagTask = {
  id: string;
  role: string;
  status: string;
  dependsOn: string[];
};

const nodeTypes: NodeTypes = { taskNode: TaskNode };

const defaultEdgeOptions = {
  type: "smoothstep",
  style: { stroke: "#7C5CFF", strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#7C5CFF" },
};

export function ProjectDagFlow({ tasks }: { tasks: DagTask[] }) {
  const nodes = useMemo(() => buildNodes(tasks) as Node[], [tasks]);
  const edges = useMemo(() => buildEdges(tasks) as Edge[], [tasks]);

  return (
    <SavoirCard className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">DAG execution</h2>
        <span className="font-mono text-xs text-white/45">{tasks.length} tasks</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-white/55">
          {"Le DAG sera affiché après validation du plan d'exécution."}
        </p>
      ) : (
        <div className="h-80 overflow-hidden rounded-lg bg-[#05091A]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            colorMode="dark"
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
          >
            <Background color="#1a1f3a" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      )}
    </SavoirCard>
  );
}
