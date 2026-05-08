import type { DefaultSession } from "next-auth";
import type { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    organizationId?: string | null;
    role?: UserRole;
  }
}
