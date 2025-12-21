import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  const project = await db.project.findUnique({
    where: { shareId },
    select: {
      id: true,
      name: true,
      description: true,
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
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(project);
}
