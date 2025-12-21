import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  pmProcedure,
  studentProcedure,
  protectedProcedure,
} from "../trpc";

const StatusEnum = z.enum([
  "Backlog",
  "Todo",
  "InProgress",
  "Done",
  "Canceled",
]);

export const assignmentsRouter = router({
  // PM: Assign project to students (creates assignments for all features)
  bulkAssign: pmProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        studentIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const features = await ctx.db.feature.findMany({
        where: { projectId: input.projectId },
        select: { id: true },
      });

      const assignments = input.studentIds.flatMap((studentId) =>
        features.map((feature) => ({
          projectId: input.projectId,
          featureId: feature.id,
          studentId,
        })),
      );

      return ctx.db.assignment.createMany({
        data: assignments,
        skipDuplicates: true,
      });
    }),

  // PM: Remove all assignments for a student from a project
  removeStudentFromProject: pmProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        studentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.assignment.deleteMany({
        where: { projectId: input.projectId, studentId: input.studentId },
      });
    }),

  // Get assignments for a project (for PM view)
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.assignment.findMany({
        where: { projectId: input.projectId },
        include: {
          student: true,
          feature: true,
        },
        orderBy: { assignedAt: "desc" },
      });
    }),

  // Get assigned students for a project (grouped)
  getAssignedStudents: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const assignments = await ctx.db.assignment.findMany({
        where: { projectId: input.projectId },
        include: { student: true },
        distinct: ["studentId"],
      });
      return assignments.map((a) => a.student);
    }),

  // Student: Get my assignments (grouped by project)
  myAssignments: studentProcedure.query(async ({ ctx }) => {
    return ctx.db.assignment.findMany({
      where: { studentId: ctx.user.id },
      include: {
        project: { include: { org: true } },
        feature: true,
      },
      orderBy: [
        { project: { name: "asc" } },
        { feature: { createdAt: "asc" } },
      ],
    });
  }),

  // Student: Get assignments for a specific project (grouped by status)
  myProjectAssignments: studentProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const assignments = await ctx.db.assignment.findMany({
        where: {
          studentId: ctx.user.id,
          projectId: input.projectId,
        },
        include: {
          feature: true,
        },
        orderBy: { feature: { createdAt: "asc" } },
      });

      // Get project details with all features
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        select: {
          id: true,
          name: true,
          description: true,
          shareId: true,
          features: {
            select: {
              id: true,
              title: true,
              description: true,
              tags: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // Get IDs of features already assigned to this student
      const assignedFeatureIds = new Set(assignments.map((a) => a.featureId));

      // Filter out assigned features to get available ones
      const availableFeatures = project.features.filter(
        (f) => !assignedFeatureIds.has(f.id)
      );

      // Group by status
      const grouped = {
        InProgress: [] as typeof assignments,
        Todo: [] as typeof assignments,
        Backlog: [] as typeof assignments,
        Done: [] as typeof assignments,
        Canceled: [] as typeof assignments,
      };

      for (const assignment of assignments) {
        const status = assignment.status as keyof typeof grouped;
        if (grouped[status]) {
          grouped[status].push(assignment);
        }
      }

      // Calculate progress
      const total = assignments.length;
      const done = grouped.Done.length;
      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

      // Return project without features array (we return availableFeatures separately)
      const { features: _, ...projectWithoutFeatures } = project;

      return {
        project: projectWithoutFeatures,
        assignments: grouped,
        progress: { total, done, percentage },
        availableFeatures,
      };
    }),

  // Student: Get all projects with assignment counts (for project selector)
  myProjects: studentProcedure.query(async ({ ctx }) => {
    const assignments = await ctx.db.assignment.findMany({
      where: { studentId: ctx.user.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Group by project
    const projectMap = new Map<
      string,
      {
        project: { id: string; name: string; description: string | null };
        total: number;
        done: number;
      }
    >();

    for (const assignment of assignments) {
      const projectId = assignment.project.id;
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          project: assignment.project,
          total: 0,
          done: 0,
        });
      }
      const entry = projectMap.get(projectId)!;
      entry.total++;
      if (assignment.status === "Done") {
        entry.done++;
      }
    }

    return Array.from(projectMap.values()).map((entry) => ({
      ...entry.project,
      progress: {
        total: entry.total,
        done: entry.done,
        percentage:
          entry.total > 0 ? Math.round((entry.done / entry.total) * 100) : 0,
      },
    }));
  }),

  // Student: Get single assignment by ID
  getById: studentProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const assignment = await ctx.db.assignment.findUnique({
        where: { id: input.id },
        include: {
          feature: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!assignment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Assignment not found" });
      }

      // Verify ownership
      if (assignment.studentId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your assignment" });
      }

      return assignment;
    }),

  // Student: Update status
  updateStatus: studentProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: StatusEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const assignment = await ctx.db.assignment.findUnique({
        where: { id: input.id },
        select: { studentId: true },
      });

      if (!assignment) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Allow PM/Admin to update any, students only their own
      const userRole = (
        (ctx.user as { role?: string }).role || "student"
      ).toLowerCase();
      if (userRole === "student" && assignment.studentId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.assignment.update({
        where: { id: input.id },
        data: { status: input.status },
      });
    }),

  // Student: Leave a project (remove all their assignments from the project)
  leaveProject: studentProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Delete all assignments for this student in this project
      const result = await ctx.db.assignment.deleteMany({
        where: {
          projectId: input.projectId,
          studentId: ctx.user.id,
        },
      });

      return { deletedCount: result.count };
    }),

  // Student: Take (self-assign) a feature from a project they've joined
  takeFeature: studentProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        featureId: z.string().uuid(),
        status: StatusEnum.optional().default("Backlog"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify student has joined this project (has StudentProject record)
      const studentProject = await ctx.db.studentProject.findUnique({
        where: {
          studentId_projectId: {
            studentId: ctx.user.id,
            projectId: input.projectId,
          },
        },
      });

      if (!studentProject) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must join this project first to take features",
        });
      }

      // 2. Verify feature exists and belongs to this project
      const feature = await ctx.db.feature.findFirst({
        where: {
          id: input.featureId,
          projectId: input.projectId,
        },
      });

      if (!feature) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Feature not found in this project",
        });
      }

      // 3. Check if already assigned
      const alreadyAssigned = await ctx.db.assignment.findFirst({
        where: {
          studentId: ctx.user.id,
          featureId: input.featureId,
        },
      });

      if (alreadyAssigned) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already assigned to this feature",
        });
      }

      // 4. Create the assignment with the specified status
      return ctx.db.assignment.create({
        data: {
          projectId: input.projectId,
          featureId: input.featureId,
          studentId: ctx.user.id,
          status: input.status,
        },
        include: {
          feature: true,
        },
      });
    }),
});
