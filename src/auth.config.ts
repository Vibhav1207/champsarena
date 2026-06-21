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
