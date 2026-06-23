import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";
import * as bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          return null;
        }

        // Account Lockout check
        if (user.lockoutUntil && new Date() < new Date(user.lockoutUntil)) {
          throw new Error("LOCKOUT");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          const attempts = user.failedLoginAttempts + 1;
          const isLocked = attempts >= 5;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: attempts,
              lockoutUntil: isLocked ? new Date(Date.now() + 15 * 60 * 1000) : null,
            },
          });
          
          if (isLocked) {
            throw new Error("LOCKED_NOW");
          }
          return null;
        }

        // Reset failed login attempts on successful sign in
        if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockoutUntil: null,
            },
          });
        }

        return user;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
  },
});
