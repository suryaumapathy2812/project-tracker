import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, protectedProcedure } from "../trpc";
import { auth } from "@/lib/auth";

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

  // Add member by email - creates user if doesn't exist
  addMemberByEmail: adminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().optional(),
        orgId: z.string().uuid(),
        role: RoleEnum.default("student"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Check if user exists by email
      let user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      // 2. If not, create via Better Auth admin API
      if (!user) {
        const defaultName = input.name || input.email.split("@")[0];
        const defaultPassword = "blablabla";

        try {
          await auth.api.signUpEmail({
            body: {
              email: input.email,
              password: defaultPassword,
              name: defaultName,
            },
          });

          // Fetch the newly created user
          user = await ctx.db.user.findUnique({
            where: { email: input.email },
          });

          if (!user) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create user",
            });
          }

          // Update user role
          await ctx.db.user.update({
            where: { id: user.id },
            data: { role: input.role.charAt(0).toUpperCase() + input.role.slice(1) },
          });
        } catch (error) {
          console.error("Failed to create user:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user account",
          });
        }
      }

      // 3. Check if user is already a member of this org
      const existingMember = await ctx.db.orgMember.findUnique({
        where: { userId_orgId: { userId: user.id, orgId: input.orgId } },
      });

      if (existingMember) {
        // Update role if different
        if (existingMember.role !== input.role) {
          return ctx.db.orgMember.update({
            where: { userId_orgId: { userId: user.id, orgId: input.orgId } },
            data: { role: input.role },
            include: { user: true },
          });
        }
        throw new TRPCError({
          code: "CONFLICT",
          message: "User is already a member of this organization",
        });
      }

      // 4. Add to OrgMember table
      return ctx.db.orgMember.create({
        data: { userId: user.id, orgId: input.orgId, role: input.role },
        include: { user: true },
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
