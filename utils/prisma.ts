import { PrismaClient, Prisma } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["info"],
  });

prisma.$use(
  async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>
  ) => {
    if (params.model && params.action === "findMany") {
      params.args = params.args || {};
      params.args.where = params.args.where || {};
      if (!("archived" in params.args.where)) {
        params.args.where.archived = false;
      }
    }

    return next(params);
  }
);

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
