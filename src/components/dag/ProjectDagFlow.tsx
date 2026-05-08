import { SavoirCard } from "@/components/savoir/SavoirCard";
import { TaskStatusBadge } from "@/components/dag/TaskStatusBadge";

export type DagTask = {
  id: string;
  role: string;
  status: string;
  dependsOn: string[];
};

export function ProjectDagFlow({ tasks }: { tasks: DagTask[] }) {
  return (
    <SavoirCard className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">DAG execution</h2>
        <span className="font-mono text-xs text-white/45">{tasks.length} tasks</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-sm text-white/55">Aucun plan DAG cree.</p>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:grid-cols-[36px_1fr_auto]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7C5CFF]/20 font-mono text-sm text-[#C9BEFF]">
                {index + 1}
              </div>
              <div>
                <p className="font-semibold">{task.role}</p>
                <p className="mt-1 font-mono text-xs text-white/45">
                  dependsOn: {task.dependsOn.length > 0 ? task.dependsOn.join(", ") : "root"}
                </p>
              </div>
              <TaskStatusBadge status={task.status} />
            </div>
          ))}
        </div>
      )}
    </SavoirCard>
  );
}
