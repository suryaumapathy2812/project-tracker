import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isValidUUID } from "../../lib/validation";
import { notFound, badRequest, successResponse } from "../../lib/response";
import type { PublicProject } from "../../lib/types";

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
      id: true,
      shareId: true,
      name: true,
      description: true,
      createdAt: true,
      org: {
        select: {
          name: true,
          logo: true,
        },
      },
      features: {
        select: {
          id: true,
          title: true,
          description: true,
          tags: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          features: true,
          assignments: true,
        },
      },
    },
  });

  if (!project) {
    return notFound("Project not found");
  }

  const response: PublicProject = {
    id: project.id,
    shareId: project.shareId,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt.toISOString(),
    org: {
      name: project.org.name,
      logo: project.org.logo,
    },
    features: project.features.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      tags: f.tags,
      createdAt: f.createdAt.toISOString(),
    })),
    stats: {
      featureCount: project._count.features,
      assignmentCount: project._count.assignments,
    },
  };

  return successResponse(response);
}
