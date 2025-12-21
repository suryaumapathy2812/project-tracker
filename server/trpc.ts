import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

function resolveRole(ctx: Context) {
  return (
    ctx.activeOrgRole ||
    (ctx.session?.user as { role?: string })?.role ||
    "student"
  );
}

// Middleware: Enforce authentication
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      activeOrgId: ctx.activeOrgId,
      activeOrgRole: ctx.activeOrgRole,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceAuth);

// Middleware: Enforce specific roles
const enforceRole = (allowedRoles: string[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    const userRole = resolveRole(ctx).toLowerCase();
    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Insufficient permissions",
      });
    }
    return next({
      ctx: {
        session: ctx.session,
        user: ctx.session.user,
        activeOrgId: ctx.activeOrgId,
        activeOrgRole: ctx.activeOrgRole,
      },
    });
  });

// Role-based procedures
export const adminProcedure = t.procedure.use(enforceRole(["admin"]));
export const pmProcedure = t.procedure.use(enforceRole(["admin", "pm"]));
export const studentProcedure = t.procedure.use(
  enforceRole(["admin", "pm", "student"]),
);
