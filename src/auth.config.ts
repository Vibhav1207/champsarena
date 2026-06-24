import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [], // Populated in auth.ts
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role!;
        token.elo = user.elo!;
        token.trainerId = user.trainerId!;
        if (user.image) {
          token.picture = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.elo = token.elo as number;
        session.user.trainerId = token.trainerId as string;
        if (token.picture) {
          session.user.image = token.picture as string;
        }
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith("/login");
      const isAdminPage = nextUrl.pathname.startsWith("/admin");
      const isProfilePage = nextUrl.pathname.startsWith("/profile");

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/profile", nextUrl));
        }
        return true;
      }

      if (isAdminPage) {
        if (!isLoggedIn) return false;
        const role = auth?.user?.role;
        return role === "ADMIN" || role === "SUPER_ADMIN";
      }

      if (isProfilePage) {
        return isLoggedIn;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
