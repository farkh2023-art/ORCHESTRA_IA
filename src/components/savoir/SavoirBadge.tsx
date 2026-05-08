import type { ReactNode } from "react";

type Tone = "turquoise" | "violet" | "gold" | "neutral" | "danger";

const tones: Record<Tone, string> = {
  turquoise: "border-[#00E5D1]/40 bg-[#00E5D1]/10 text-[#75FFF2]",
  violet: "border-[#7C5CFF]/45 bg-[#7C5CFF]/12 text-[#C9BEFF]",
  gold: "border-[#F4C77B]/45 bg-[#F4C77B]/12 text-[#FFE0A3]",
  neutral: "border-white/15 bg-white/8 text-white/75",
  danger: "border-red-400/45 bg-red-500/10 text-red-200",
};

export function SavoirBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
