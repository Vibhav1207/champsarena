import { DefaultSession } from "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      elo: number;
      trainerId: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
  }

  interface User {
    role?: Role;
    elo?: number;
    trainerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    elo: number;
    trainerId: string;
    picture?: string;
  }
}
