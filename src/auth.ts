import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { findOrCreateOrganization } from "@/lib/auth/tenant";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            select: { organizationId: true, role: true },
          });
          session.user.organizationId = dbUser?.organizationId ?? null;
          session.user.role = dbUser?.role ?? "MEMBER";
        } catch {
          session.user.organizationId = null;
          session.user.role = "MEMBER";
        }
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.email) return;
      try {
        const org = await findOrCreateOrganization(user.email);
        await db.user.update({
          where: { id: user.id },
          data: { organizationId: org.id },
        });
      } catch {
        // tenant provisioning failure ne bloque pas la connexion
      }
    },
  },
});
