import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isValidUUID } from "../../../lib/validation";
import { notFound, badRequest, successResponse } from "../../../lib/response";
import {
  createEmptyStatusCounts,
  type FeaturesListResponse,
  type PublicFeature,
  type PublicFeatureWithStats,
} from "../../../lib/types";
import type { Status } from "@/lib/status-config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;
  const { searchParams } = new URL(request.url);
  const includeStats = searchParams.get("includeStats") === "true";

  // Validate UUID format
  if (!isValidUUID(shareId)) {
    return badRequest("Invalid shareId format");
  }

  const project = await db.project.findUnique({
    where: { shareId },
    select: {
      name: true,
      shareId: true,
      features: {
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          createdAt: true,
          ...(includeStats && {
            assignments: {
              select: { status: true },
            },
          }),
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) {
    return notFound("Project not found");
  }

  const features: (PublicFeature | PublicFeatureWithStats)[] =
    project.features.map((f) => {
      const base: PublicFeature = {
        id: f.id,
        title: f.title,
        description: f.description,
        tags: f.tags,
        createdAt: f.createdAt.toISOString(),
      };

      if (includeStats && "assignments" in f) {
        const assignments = f.assignments as { status: string }[];
        const statusCounts = createEmptyStatusCounts();

        for (const a of assignments) {
          statusCounts[a.status as Status]++;
        }

        return {
          ...base,
          stats: {
            totalAssignments: assignments.length,
            statusCounts,
          },
        } as PublicFeatureWithStats;
      }

      return base;
    });

  const response: FeaturesListResponse = {
    shareId: project.shareId,
    projectName: project.name,
    features,
  };

  return successResponse(response);
}
