import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../trpc";
import { slugify, generateUniqueSlug } from "@/lib/slugify";

export const batchesRouter = router({
  listByOrg: adminProcedure
    .input(z.object({ orgId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.batch.findMany({
        where: { orgId: input.orgId },
        include: { _count: { select: { students: true } } },
        orderBy: { createdAt: "desc" },
      });
    }),

  // List batches by org slug (for navigation)
  listByOrgSlug: protectedProcedure
    .input(z.object({ orgSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.customOrg.findUnique({
        where: { slug: input.orgSlug },
        select: { id: true },
      });
      if (!org) return [];

      return ctx.db.batch.findMany({
        where: { orgId: org.id },
        select: { id: true, slug: true, name: true },
        orderBy: { createdAt: "desc" },
      });
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.batch.findUnique({
        where: { id: input.id },
        include: {
          students: true,
          org: true,
        },
      });
    }),

  // Get batch by slug
  getBySlug: protectedProcedure
    .input(z.object({ orgSlug: z.string(), batchSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const org = await ctx.db.customOrg.findUnique({
        where: { slug: input.orgSlug },
        select: { id: true },
      });
      if (!org) return null;

      return ctx.db.batch.findUnique({
        where: {
          orgId_slug: { orgId: org.id, slug: input.batchSlug },
        },
        include: {
          students: { select: { id: true, name: true, email: true, image: true } },
          org: { select: { id: true, slug: true, name: true } },
          _count: { select: { students: true } },
        },
      });
    }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1), orgId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Generate unique slug within the org
      const existingSlugs = await ctx.db.batch.findMany({
        where: { orgId: input.orgId },
        select: { slug: true },
      });
      const slug = generateUniqueSlug(
        input.name,
        existingSlugs.map((b) => b.slug)
      );

      return ctx.db.batch.create({
        data: { ...input, slug },
      });
    }),

  update: adminProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.batch.update({
        where: { id: input.id },
        data: { name: input.name },
      });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.batch.delete({ where: { id: input.id } });
    }),

  assignStudent: adminProcedure
    .input(z.object({ batchId: z.string().uuid(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { batchId: input.batchId },
      });
    }),

  removeStudent: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: input.userId },
        data: { batchId: null },
      });
    }),
});
