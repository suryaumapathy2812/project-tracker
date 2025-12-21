import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../trpc";

const RoleEnum = z.enum(["admin", "pm", "student"]);

export const usersRouter = router({
  listByOrg: adminProcedure
    .input(z.object({ orgId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.orgMember.findMany({
        where: { orgId: input.orgId },
        include: { user: { include: { batch: true } } },
      });
    }),

  listAll: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findMany({
      include: { batch: true, memberships: { include: { org: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get students for assignment (PM can use this)
  listStudentsByOrg: protectedProcedure
    .input(z.object({ orgId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.orgMember.findMany({
        where: {
          orgId: input.orgId,
          role: "student",
        },
        include: { user: { include: { batch: true } } },
      });
    }),

  updateRole: adminProcedure
    .input(z.object({ userId: z.string(), orgId: z.string().uuid(), role: RoleEnum }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.orgMember.update({
        where: { userId_orgId: { userId: input.userId, orgId: input.orgId } },
        data: { role: input.role },
      });
    }),

  addToOrg: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        orgId: z.string().uuid(),
        role: RoleEnum.default("student"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.orgMember.create({
        data: { userId: input.userId, orgId: input.orgId, role: input.role },
      });
    }),

  removeFromOrg: adminProcedure
    .input(z.object({ userId: z.string(), orgId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.orgMember.delete({
        where: { userId_orgId: { userId: input.userId, orgId: input.orgId } },
      });
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        batch: true,
        memberships: { include: { org: true } },
      },
    });
  }),
});
