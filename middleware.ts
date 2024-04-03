import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: async ({ req, token }: any) => {
      if (!token && req.nextUrl.pathname !== "/sign-in") {
        return false;
      }

      if (token && req.nextUrl.pathname === "/sign-in") {
        return false;
      }

      return true;
    },
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
    error: "/sign-in",
  },
});
