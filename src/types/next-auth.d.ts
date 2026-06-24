import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      elo: number;
      trainerId: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
    elo?: number;
    trainerId?: string;
    homeRegion?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    elo: number;
    trainerId: string;
  }
}
