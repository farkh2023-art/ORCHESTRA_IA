import { SavoirCard } from "@/components/savoir/SavoirCard";

export function CostPanel({ tokens = 0, costUsd = 0 }: { tokens?: number; costUsd?: number }) {
  return (
    <SavoirCard className="p-5">
      <p className="text-sm font-semibold text-white/60">Budget runtime</p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="font-mono text-2xl text-[#00E5D1]">{tokens.toLocaleString("fr-FR")}</p>
          <p className="text-xs text-white/50">tokens</p>
        </div>
        <div>
          <p className="font-mono text-2xl text-[#F4C77B]">${costUsd.toFixed(4)}</p>
          <p className="text-xs text-white/50">cout estime</p>
        </div>
      </div>
    </SavoirCard>
  );
}
