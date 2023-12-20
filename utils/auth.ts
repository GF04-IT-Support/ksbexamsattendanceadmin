import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import { getServerSession } from "next-auth";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }: any) {
      if (account && account.provider === "google") {
        const { id, name, email, image } = user;

        const existingUser = await prisma.user.findUnique({
          where: { email: email },
        });

        if (existingUser && existingUser.role === "admin") {
          await prisma.user.update({
            where: { email: email },
            data: {
              name: name,
              googleId: id,
              image: image,
              account: {
                upsert: {
                  create: {
                    idToken: account.id_token,
                    providerAccountId: account.providerAccountId,
                    provider: account.provider,
                    providerType: account.type,
                    accessToken: account.access_token,
                    accessTokenExpires: new Date(account.expires_at * 1000),
                  },
                  update: {
                    idToken: account.id_token,
                    providerAccountId: account.providerAccountId,
                    provider: account.provider,
                    providerType: account.type,
                    accessToken: account.access_token,
                    accessTokenExpires: new Date(account.expires_at * 1000),
                  },
                },
              },
            },
          });

          return true;
        }
      }

      return false;
    },
    jwt: async ({ token, user }: any) => {
      if (user) {
        token.user_id = user.id;
        token.role = user.role;
        token.subRole = user.subRole;
      }
      return Promise.resolve(token);
    },
    session: async ({ session, token }: any) => {
      if (token) {
        session.user.id = token.user_id;
        session.user.role = token.role;
        session.user.subRole = token.subRole;
      }
      return Promise.resolve(session);
    },
  },
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-in",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt" as any,
  },
  debugger: process.env.NODE_ENV === "development",
};

export const getAuthSession = () => getServerSession(authOptions);
