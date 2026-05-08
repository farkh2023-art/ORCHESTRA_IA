import { SavoirButton } from "@/components/savoir/SavoirButton";
import { SavoirCard } from "@/components/savoir/SavoirCard";
import { SavoirShell } from "@/components/savoir/SavoirShell";

const steps = [
  ["Brief", "Capture du besoin et cadrage initial."],
  ["Clarification", "Spec projet, hypotheses et points humains."],
  ["Agents", "Equipe noyau recrutee depuis AgentTemplate.role."],
  ["DAG", "Execution controlee par Task.dependsOn[]."],
  ["Validation", "Rapports task/final et checkpoints HITL."],
  ["Rapport", "Livrable Markdown consolide."],
];

export default function Home() {
  return (
    <SavoirShell>
      <section className="grid min-h-[72vh] items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[#00E5D1]">ORCHESTRA_IA</p>
          <h1 className="font-display text-5xl font-bold leading-tight sm:text-7xl">
            Orchestrez une equipe IA avec controle humain.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
            SAVOIR_IA transforme un brief en cahier des charges, recrute les agents noyau, planifie le DAG,
            execute les tasks, valide les outputs et compile le rapport final.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <SavoirButton href="/projects/new">Creer un projet</SavoirButton>
            <SavoirButton href="/registry" variant="secondary">
              Voir le registry
            </SavoirButton>
          </div>
        </div>
        <SavoirCard className="p-5">
          <div className="grid gap-3">
            {steps.map(([title, text], index) => (
              <div key={title} className="grid grid-cols-[36px_1fr] gap-3 rounded-lg bg-black/20 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00E5D1]/15 font-mono text-sm text-[#75FFF2]">
                  {index + 1}
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-white/55">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </SavoirCard>
      </section>
    </SavoirShell>
  );
}
