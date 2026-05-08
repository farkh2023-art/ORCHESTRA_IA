import { SavoirCard } from "@/components/savoir/SavoirCard";
import { SavoirButton } from "@/components/savoir/SavoirButton";
import { respondHumanCheckpointAction } from "@/app/actions/projectActions";

type HitlTask = {
  id: string;
  role: string;
  input?: unknown;
};

export function HitlConsole({ tasks }: { tasks: HitlTask[] }) {
  return (
    <SavoirCard className="p-5">
      <h2 className="font-display text-xl font-semibold">Console HITL</h2>
      <div className="mt-5 space-y-4">
        {tasks.length === 0 ? (
          <p className="text-sm text-white/55">Aucun checkpoint humain en attente.</p>
        ) : (
          tasks.map((task) => (
            <form key={task.id} action={respondHumanCheckpointAction} className="rounded-lg border border-[#F4C77B]/25 bg-[#F4C77B]/8 p-4">
              <input type="hidden" name="taskId" value={task.id} />
              <p className="font-semibold text-[#FFE0A3]">{task.role}</p>
              <p className="mt-2 line-clamp-3 text-sm text-white/65">{JSON.stringify(task.input ?? {})}</p>
              <textarea
                name="response"
                className="mt-4 min-h-24 w-full rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-white outline-none focus:border-[#00E5D1]/60"
                placeholder="Decision humaine, precision ou validation..."
              />
              <div className="mt-3">
                <SavoirButton type="submit">Envoyer</SavoirButton>
              </div>
            </form>
          ))
        )}
      </div>
    </SavoirCard>
  );
}
