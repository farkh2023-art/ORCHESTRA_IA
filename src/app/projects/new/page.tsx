import { createProjectAction } from "@/app/actions/projectActions";
import { SavoirButton } from "@/components/savoir/SavoirButton";
import { SavoirCard } from "@/components/savoir/SavoirCard";
import { SavoirShell } from "@/components/savoir/SavoirShell";

export default function NewProjectPage() {
  return (
    <SavoirShell>
      <div className="mx-auto max-w-4xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#00E5D1]">Intake</p>
        <h1 className="font-display text-4xl font-bold">Nouveau projet ORCHESTRA_IA</h1>
        <p className="mt-4 text-white/65">
          Le brief genere une ProjectSpec initiale. La validation du cahier des charges se fait ensuite dans le dashboard projet.
        </p>
        <SavoirCard className="mt-8 p-6">
          <form action={createProjectAction} className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-white/70">Titre</span>
              <input
                name="title"
                required
                minLength={3}
                maxLength={200}
                className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#00E5D1]/60"
                placeholder="Lancement d'une offre IA interne"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-white/70">Brief</span>
              <textarea
                name="brief"
                required
                minLength={20}
                maxLength={10000}
                className="mt-2 min-h-56 w-full rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#00E5D1]/60"
                placeholder="Objectifs, contraintes, livrables attendus, contexte..."
              />
            </label>
            <div className="rounded-lg border border-[#F4C77B]/25 bg-[#F4C77B]/8 p-4 text-sm text-white/68">
              Questions de clarification : elles apparaitront ici lorsque l&apos;agent Coordinateur ou un checkpoint HITL en demandera.
            </div>
            <SavoirButton type="submit">Creer ProjectSpec</SavoirButton>
          </form>
        </SavoirCard>
      </div>
    </SavoirShell>
  );
}
