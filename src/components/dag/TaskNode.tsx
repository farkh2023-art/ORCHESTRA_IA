"use client";

import type { NodeProps } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";
import { TaskStatusBadge } from "./TaskStatusBadge";

export type TaskNodeData = { role: string; status: string };

export function TaskNode({ data }: NodeProps) {
  const { role, status } = data as TaskNodeData;

  return (
    <div className="min-w-[160px] rounded-lg border border-[#7C5CFF]/40 bg-[#0d0f1f] px-4 py-3 shadow-lg">
      <Handle type="target" position={Position.Left} style={{ background: "#7C5CFF" }} />
      <p className="truncate text-sm font-semibold text-white">{role}</p>
      <div className="mt-2">
        <TaskStatusBadge status={status} />
      </div>
      <Handle type="source" position={Position.Right} style={{ background: "#7C5CFF" }} />
    </div>
  );
}
