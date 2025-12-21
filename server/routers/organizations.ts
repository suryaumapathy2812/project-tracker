import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { v4 as uuid } from "uuid";
import { router, adminProcedure, protectedProcedure } from "../trpc";
import { generateUniqueSlug } from "@/lib/slugify";

export const organizationsRouter = router({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.customOrg.findMany({
      include: { _count: { select: { batches: true, members: true, projects: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  // List orgs for current user (for navigation dropdown)
  listForUser: protectedProcedure.query(async ({ ctx }) => {
    // Get orgs where user is a member
    const memberships = await ctx.db.orgMember.findMany({
      where: { userId: ctx.user.id },
      include: {
        org: {
          select: { id: true, slug: true, name: true, logo: true },
        },
      },
    });
    return memberships.map((m) => m.org);
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.customOrg.findUnique({
        where: { id: input.id },
        include: {
          batches: { include: { _count: { select: { students: true } } } },
          members: { include: { user: true } },
          _count: { select: { projects: true } },
        },
      });
    }),

  // Get org by slug
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.customOrg.findUnique({
        where: { slug: input.slug },
        include: {
          batches: {
            select: { id: true, slug: true, name: true },
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { batches: true, members: true, projects: true } },
        },
      });
    }),

  create: adminProcedure
    .input(z.object({ name: z.string().min(1), logo: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Generate unique slug
      const existingSlugs = await ctx.db.customOrg.findMany({
        select: { slug: true },
      });
      const slug = generateUniqueSlug(
        input.name,
        existingSlugs.map((o) => o.slug)
      );

      // Generate a shared ID for both Better Auth org and CustomOrg
      const orgId = uuid();

      try {
        // 1. Create Better Auth Organization
        await ctx.db.organization.create({
          data: {
            id: orgId,
            name: input.name,
            slug,
            logo: input.logo,
          },
        });

        // 2. Create Better Auth Member with Admin role
        await ctx.db.member.create({
          data: {
            id: uuid(),
            userId: ctx.user.id,
            organizationId: orgId,
            role: "Admin",
          },
        });

        // 3. Create CustomOrg with same ID
        const customOrg = await ctx.db.customOrg.create({
          data: {
            id: orgId,
            name: input.name,
            slug,
            logo: input.logo,
          },
        });

        // 4. Create OrgMember with admin role
        await ctx.db.orgMember.create({
          data: {
            userId: ctx.user.id,
            orgId: orgId,
            role: "admin",
          },
        });

        return customOrg;
      } catch (error) {
        console.error("Failed to create organization:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create organization",
        });
      }
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.customOrg.update({ where: { id }, data });
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.customOrg.delete({ where: { id: input.id } });
    }),

  // Bootstrap current active organization into app DB and set caller as admin
  // This is called during sign-up after creating an org to sync with app's custom tables
  bootstrapFromActiveOrg: protectedProcedure
    .input(
      z.object({
        orgId: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1),
        logo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[bootstrapFromActiveOrg] Starting:", {
        userId: ctx.user.id,
        orgId: input.orgId,
        activeOrgId: ctx.activeOrgId,
      });

      // First, verify the user is a member of this org in Better Auth's Member table
      const existingMember = await ctx.db.member.findFirst({
        where: { userId: ctx.user.id, organizationId: input.orgId },
      });

      if (!existingMember) {
        console.error("[bootstrapFromActiveOrg] User is not a member of org:", {
          userId: ctx.user.id,
          orgId: input.orgId,
        });
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User is not a member of this organization",
        });
      }

      console.log("[bootstrapFromActiveOrg] Existing member found:", existingMember);

      // Create/update app's custom CustomOrg table (sync slug from Better Auth Organization)
      const org = await ctx.db.customOrg.upsert({
        where: { id: input.orgId },
        update: { name: input.name, slug: input.slug, logo: input.logo },
        create: { id: input.orgId, name: input.name, slug: input.slug, logo: input.logo },
      });

      // Update app's custom OrgMember table
      await ctx.db.orgMember.upsert({
        where: { userId_orgId: { userId: ctx.user.id, orgId: input.orgId } },
        update: { role: "admin" },
        create: { userId: ctx.user.id, orgId: input.orgId, role: "admin" },
      });

      // Note: Better Auth's Member.role should already be set correctly by creatorRole: "Admin"
      // But let's verify and log it
      const verifyMember = await ctx.db.member.findFirst({
        where: { userId: ctx.user.id, organizationId: input.orgId },
      });
      console.log("[bootstrapFromActiveOrg] Better Auth Member role:", verifyMember?.role);

      return org;
    }),
});
