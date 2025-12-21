import { router, publicProcedure } from "../trpc";
import { organizationsRouter } from "./organizations";
import { batchesRouter } from "./batches";
import { usersRouter } from "./users";
import { projectsRouter } from "./projects";
import { featuresRouter } from "./features";
import { assignmentsRouter } from "./assignments";
import { studentProjectsRouter } from "./student-projects";

export const appRouter = router({
  organizations: organizationsRouter,
  batches: batchesRouter,
  users: usersRouter,
  projects: projectsRouter,
  features: featuresRouter,
  assignments: assignmentsRouter,
  studentProjects: studentProjectsRouter,
  health: publicProcedure.query(() => ({ status: "ok" })),
});

export type AppRouter = typeof appRouter;
