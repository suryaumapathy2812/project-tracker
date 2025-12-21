import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, studentProcedure } from "../trpc";

export const studentProjectsRouter = router({
  // Get student's joined projects with progress
  list: studentProcedure.query(async ({ ctx }) => {
    const studentProjects = await ctx.db.studentProject.findMany({
      where: { studentId: ctx.user.id },
      include: {
        project: {
          include: {
            features: { select: { id: true } },
            _count: { select: { features: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    // Get assignment counts for each project
    const projectIds = studentProjects.map((sp) => sp.projectId);
    const assignments = await ctx.db.assignment.findMany({
      where: {
        studentId: ctx.user.id,
        projectId: { in: projectIds },
      },
      select: { projectId: true, status: true },
    });

    // Group assignments by project
    const assignmentsByProject = assignments.reduce(
      (acc, a) => {
        if (!acc[a.projectId]) {
          acc[a.projectId] = { total: 0, done: 0 };
        }
        acc[a.projectId].total++;
        if (a.status === "Done") {
          acc[a.projectId].done++;
        }
        return acc;
      },
      {} as Record<string, { total: number; done: number }>,
    );

    return studentProjects.map((sp) => {
      const progress = assignmentsByProject[sp.projectId] || { total: 0, done: 0 };
      return {
        id: sp.project.id,
        name: sp.project.name,
        description: sp.project.description,
        featureCount: sp.project._count.features,
        joinedAt: sp.joinedAt,
        progress: {
          total: progress.total,
          done: progress.done,
          percentage: progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0,
        },
      };
    });
  }),

  // Get all available projects (not yet joined by student)
  available: studentProcedure.query(async ({ ctx }) => {
    const joinedProjectIds = await ctx.db.studentProject.findMany({
      where: { studentId: ctx.user.id },
      select: { projectId: true },
    });

    const joinedIds = joinedProjectIds.map((sp) => sp.projectId);

    const projects = await ctx.db.project.findMany({
      where: {
        id: { notIn: joinedIds },
      },
      include: {
        _count: { select: { features: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      featureCount: p._count.features,
    }));
  }),

  // Preview a project (get details with features before joining)
  preview: studentProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: {
          features: {
            select: { id: true, title: true, description: true, tags: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        features: project.features,
      };
    }),

  // Join a project
  join: studentProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if project exists
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Check if already joined
      const existing = await ctx.db.studentProject.findUnique({
        where: {
          studentId_projectId: {
            studentId: ctx.user.id,
            projectId: input.projectId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Already joined this project" });
      }

      return ctx.db.studentProject.create({
        data: {
          studentId: ctx.user.id,
          projectId: input.projectId,
        },
        include: {
          project: true,
        },
      });
    }),

  // Leave a project (deletes all assignments too)
  leave: studentProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete all assignments first
      await ctx.db.assignment.deleteMany({
        where: {
          studentId: ctx.user.id,
          projectId: input.projectId,
        },
      });

      // Delete the student project record
      return ctx.db.studentProject.delete({
        where: {
          studentId_projectId: {
            studentId: ctx.user.id,
            projectId: input.projectId,
          },
        },
      });
    }),

  // Get single project details for student
  getById: studentProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify student has joined this project
      const studentProject = await ctx.db.studentProject.findUnique({
        where: {
          studentId_projectId: {
            studentId: ctx.user.id,
            projectId: input.projectId,
          },
        },
        include: {
          project: {
            include: {
              features: {
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      });

      if (!studentProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found or not joined",
        });
      }

      // Get student's assignments for this project
      const assignments = await ctx.db.assignment.findMany({
        where: {
          studentId: ctx.user.id,
          projectId: input.projectId,
        },
        include: { feature: true },
        orderBy: { feature: { createdAt: "asc" } },
      });

      // Group assignments by status
      const grouped = {
        InProgress: [] as typeof assignments,
        Todo: [] as typeof assignments,
        Backlog: [] as typeof assignments,
        Done: [] as typeof assignments,
        Canceled: [] as typeof assignments,
      };

      const assignedFeatureIds = new Set<string>();

      for (const assignment of assignments) {
        const status = assignment.status as keyof typeof grouped;
        if (grouped[status]) {
          grouped[status].push(assignment);
        }
        assignedFeatureIds.add(assignment.featureId);
      }

      // Get available features (not yet taken by student)
      const availableFeatures = studentProject.project.features.filter(
        (f) => !assignedFeatureIds.has(f.id),
      );

      // Calculate progress
      const total = assignments.length;
      const done = grouped.Done.length;
      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        project: {
          id: studentProject.project.id,
          name: studentProject.project.name,
          description: studentProject.project.description,
        },
        assignments: grouped,
        progress: { total, done, percentage },
        availableFeatures,
        joinedAt: studentProject.joinedAt,
      };
    }),
});
