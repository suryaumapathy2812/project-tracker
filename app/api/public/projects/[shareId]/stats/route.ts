import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isValidUUID } from "../../../lib/validation";
import { notFound, badRequest, successResponse } from "../../../lib/response";
import {
  createEmptyStatusCounts,
  type PublicProjectStats,
} from "../../../lib/types";
import type { Status } from "@/lib/status-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  // Validate UUID format
  if (!isValidUUID(shareId)) {
    return badRequest("Invalid shareId format");
  }

  const project = await db.project.findUnique({
    where: { shareId },
    select: {
      shareId: true,
      name: true,
      _count: { select: { features: true } },
      assignments: {
        select: {
          status: true,
          studentId: true,
        },
      },
    },
  });

  if (!project) {
    return notFound("Project not found");
  }

  const statusBreakdown = createEmptyStatusCounts();
  const uniqueStudents = new Set<string>();

  for (const a of project.assignments) {
    statusBreakdown[a.status as Status]++;
    uniqueStudents.add(a.studentId);
  }

  const total = project.assignments.length;
  const done = statusBreakdown.Done;
  const completionPercentage = total > 0 ? Math.round((done / total) * 100) : 0;

  const response: PublicProjectStats = {
    shareId: project.shareId,
    projectName: project.name,
    featureCount: project._count.features,
    assignmentStats: {
      totalStudents: uniqueStudents.size,
      totalAssignments: total,
      statusBreakdown,
      completionPercentage,
    },
  };

  return successResponse(response);
}
