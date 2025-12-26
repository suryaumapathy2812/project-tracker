import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse } from "../lib/response";

export interface ProjectListItem {
  id: string;
  shareId: string;
  name: string;
  description: string | null;
  createdAt: string;
  org: {
    name: string;
    logo: string | null;
  };
  stats: {
    featureCount: number;
    assignmentCount: number;
  };
}

export interface ProjectListResponse {
  projects: ProjectListItem[];
  total: number;
}

export async function GET(request: NextRequest) {
  const projects = await db.project.findMany({
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
      _count: {
        select: {
          features: true,
          assignments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const response: ProjectListResponse = {
    projects: projects.map((p) => ({
      id: p.id,
      shareId: p.shareId,
      name: p.name,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
      org: {
        name: p.org.name,
        logo: p.org.logo,
      },
      stats: {
        featureCount: p._count.features,
        assignmentCount: p._count.assignments,
      },
    })),
    total: projects.length,
  };

  return successResponse(response);
}
