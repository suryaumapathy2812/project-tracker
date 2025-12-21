import { z } from "zod";
import { router, pmProcedure, publicProcedure, protectedProcedure } from "../trpc";

export const projectsRouter = router({
  // List projects user has access to
  list: protectedProcedure.query(async ({ ctx }) => {
    // Get user's org memberships
    const memberships = await ctx.db.orgMember.findMany({
      where: { userId: ctx.user.id },
      select: { orgId: true },
    });
    const orgIds = memberships.map((m) => m.orgId);

    return ctx.db.project.findMany({
      where: { orgId: { in: orgIds } },
      include: {
        org: true,
        creator: true,
        _count: { select: { features: true, assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // List projects for a specific org
  listByOrg: protectedProcedure
    .input(z.object({ orgId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findMany({
        where: { orgId: input.orgId },
        include: {
          org: true,
          creator: true,
          _count: { select: { features: true, assignments: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findUnique({
        where: { id: input.id },
        include: {
          org: true,
          creator: true,
          features: {
            include: {
              assignments: { include: { student: true } },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  create: pmProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        orgId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.create({
        data: { ...input, createdBy: ctx.user.id },
      });
    }),

  update: pmProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.project.update({ where: { id }, data });
    }),

  delete: pmProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.project.delete({ where: { id: input.id } });
    }),

  // Public endpoint for share links
  getByShareId: publicProcedure
    .input(z.object({ shareId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.project.findUnique({
        where: { shareId: input.shareId },
        include: {
          org: { select: { name: true, logo: true } },
          features: {
            include: {
              assignments: {
                include: { student: { select: { id: true, name: true, image: true } } },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),
});
