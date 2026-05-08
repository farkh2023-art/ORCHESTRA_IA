import Link from "next/link";
import type { ReactNode } from "react";

const nav = [
  { href: "/projects/new", label: "Nouveau projet" },
  { href: "/registry", label: "Registry" },
];

export function SavoirShell({ children }: { children: ReactNode }) {
  return (
    <main className="savoir-grid min-h-screen bg-[#05091A] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#00E5D1] shadow-[0_0_24px_rgba(0,229,209,0.9)]" />
            <span className="font-display text-lg font-bold tracking-wide">SAVOIR_IA</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm text-white/70">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="flex-1 py-8">{children}</div>
      </div>
    </main>
  );
}
