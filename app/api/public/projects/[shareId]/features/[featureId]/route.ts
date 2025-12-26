import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isValidUUID } from "../../../../lib/validation";
import { notFound, badRequest, successResponse } from "../../../../lib/response";
import {
  createEmptyStatusCounts,
  type FeatureDetailResponse,
} from "../../../../lib/types";
import type { Status } from "@/lib/status-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string; featureId: string }> }
) {
  const { shareId, featureId } = await params;

  // Validate UUID formats
  if (!isValidUUID(shareId)) {
    return badRequest("Invalid shareId format");
  }

  if (!isValidUUID(featureId)) {
    return badRequest("Invalid featureId format");
  }

  // First verify project exists by shareId
  const project = await db.project.findUnique({
    where: { shareId },
    select: { id: true, shareId: true, name: true },
  });

  if (!project) {
    return notFound("Project not found");
  }

  // Get feature, ensuring it belongs to this project
  const feature = await db.feature.findFirst({
    where: {
      id: featureId,
      projectId: project.id,
    },
    select: {
      id: true,
      title: true,
      description: true,
      tags: true,
      createdAt: true,
      assignments: {
        select: { status: true },
      },
    },
  });

  if (!feature) {
    return notFound("Feature not found");
  }

  const statusCounts = createEmptyStatusCounts();

  for (const a of feature.assignments) {
    statusCounts[a.status as Status]++;
  }

  const response: FeatureDetailResponse = {
    id: feature.id,
    title: feature.title,
    description: feature.description,
    tags: feature.tags,
    createdAt: feature.createdAt.toISOString(),
    project: {
      shareId: project.shareId,
      name: project.name,
    },
    stats: {
      totalAssignments: feature.assignments.length,
      statusCounts,
    },
  };

  return successResponse(response);
}
