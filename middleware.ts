import { NextApiRequest, NextApiResponse } from "next";
import { withAuth } from "next-auth/middleware";

const customMiddleware = (handler: any) =>
  async function (this: any, req: NextApiRequest, res: NextApiResponse) {
    await handler(req, res);

    if (res.statusCode === 401) {
      res.writeHead(302, { Location: "/sign-in" });
      res.end();
    }
  };

export default withAuth({
  callbacks: {
    authorized: ({ req, token }: any) => {
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
  },
});
