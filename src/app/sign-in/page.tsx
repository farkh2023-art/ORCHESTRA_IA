import type { Metadata } from "next";
import { signIn } from "@/auth";
import { SavoirButton } from "@/components/savoir/SavoirButton";
import { SavoirCard } from "@/components/savoir/SavoirCard";
import { SavoirShell } from "@/components/savoir/SavoirShell";

export const metadata: Metadata = { title: "Connexion | SAVOIR_IA" };

export default function SignInPage() {
  return (
    <SavoirShell>
      <div className="flex min-h-[60vh] items-center justify-center">
        <SavoirCard className="w-full max-w-md p-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#00E5D1]">Authentification</p>
          <h1 className="font-display text-3xl font-bold">Connexion à SAVOIR_IA</h1>
          <p className="mt-3 text-sm text-white/60">
            Connectez-vous pour accéder à vos projets et à votre équipe d&apos;agents IA.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/projects/new" });
              }}
            >
              <SavoirButton type="submit" className="w-full">
                Continuer avec GitHub
              </SavoirButton>
            </form>
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/projects/new" });
              }}
            >
              <SavoirButton type="submit" variant="secondary" className="w-full">
                Continuer avec Google
              </SavoirButton>
            </form>
          </div>
        </SavoirCard>
      </div>
    </SavoirShell>
  );
}
