import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { SavoirButton } from "@/components/savoir/SavoirButton";
import { SavoirCard } from "@/components/savoir/SavoirCard";
import { SavoirShell } from "@/components/savoir/SavoirShell";

export const metadata: Metadata = { title: "Compte | SAVOIR_IA" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <SavoirShell>
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-[#00E5D1]">Profil</p>
        <h1 className="font-display text-3xl font-bold">Mon compte</h1>
        <SavoirCard className="mt-6 p-6">
          <div className="flex items-start gap-4">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt={session.user.name ?? "Avatar"}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full border border-white/10"
              />
            )}
            <div className="space-y-1">
              <p className="text-lg font-semibold">{session.user.name ?? "Utilisateur"}</p>
              <p className="font-mono text-sm text-white/55">{session.user.email}</p>
              <p className="font-mono text-xs text-white/35">
                rôle : {session.user.role} · org : {session.user.organizationId ?? "non assignée"}
              </p>
            </div>
          </div>
        </SavoirCard>
        <div className="mt-6">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <SavoirButton type="submit" variant="secondary">
              Se déconnecter
            </SavoirButton>
          </form>
        </div>
      </div>
    </SavoirShell>
  );
}
