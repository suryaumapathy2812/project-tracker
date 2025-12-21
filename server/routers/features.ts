import { z } from "zod";
import { revalidatePath } from "next/cache";
import { router, pmProcedure, protectedProcedure } from "../trpc";

export const featuresRouter = router({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.feature.findMany({
        where: { projectId: input.projectId },
        include: { assignments: { include: { student: true } } },
        orderBy: { createdAt: "asc" },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.feature.findUnique({
        where: { id: input.id },
        include: {
          project: true,
          assignments: { include: { student: true } },
        },
      });
    }),

  create: pmProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string(),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const feature = await ctx.db.feature.create({
        data: input,
        include: { project: { select: { shareId: true } } },
      });

      // Revalidate the public project preview page
      revalidatePath(`/p/${feature.project.shareId}`);

      return feature;
    }),

  update: pmProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const feature = await ctx.db.feature.update({
        where: { id },
        data,
        include: { project: { select: { shareId: true } } },
      });

      // Revalidate the public project preview page
      revalidatePath(`/p/${feature.project.shareId}`);

      return feature;
    }),

  delete: pmProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the shareId before deleting
      const feature = await ctx.db.feature.findUnique({
        where: { id: input.id },
        select: { project: { select: { shareId: true } } },
      });

      const deleted = await ctx.db.feature.delete({ where: { id: input.id } });

      // Revalidate the public project preview page
      if (feature?.project.shareId) {
        revalidatePath(`/p/${feature.project.shareId}`);
      }

      return deleted;
    }),
});
