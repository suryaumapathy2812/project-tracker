"use client";

import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";
import { IconFolderPlus } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { useStudent } from "@/lib/providers/student-provider";
import { trpc } from "@/lib/trpc/client";

export default function StudentProjectsPage() {
  const { projects, isLoading } = useStudent();

  // Fetch available projects
  const { data: availableProjects, isLoading: isAvailableLoading } =
    trpc.studentProjects.available.useQuery();

  // Show loading state
  if (isLoading || isAvailableLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  const hasProjects = projects.length > 0;
  const hasAvailable = (availableProjects?.length ?? 0) > 0;

  // No projects and no available projects
  if (!hasProjects && !hasAvailable) {
    return (
      <PageContainer>
        <Empty className="min-h-[60vh]">
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No projects available</EmptyTitle>
            <EmptyDescription>
              There are no projects available at the moment. Check back later or
              contact your instructor.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PageContainer>
    );
  }

  // No joined projects but available projects exist
  if (!hasProjects && hasAvailable) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="Choose a Project"
            description="Select a project to preview its features and get started"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableProjects?.map((project) => (
              <Link key={project.id} href={`/p/${project.shareId}`}>
                <Card className="group h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <IconFolderPlus className="size-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {project.featureCount} features
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  // Has joined projects
  return (
    <PageContainer>
      <div className="space-y-8">
        {/* My Projects Section */}
        <div className="space-y-4">
          <PageHeader
            title="My Projects"
            description="Your active projects"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/my/${project.id}`}>
                <Card className="group h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">
                      {project.progress.total > 0
                        ? `${project.progress.done}/${project.progress.total} features done`
                        : `${project.featureCount} features available`}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Available Projects Section */}
        {hasAvailable && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Available Projects</h2>
              <span className="text-sm text-muted-foreground">
                {availableProjects?.length} available
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableProjects?.map((project) => (
                <Link key={project.id} href={`/p/${project.shareId}`}>
                  <Card className="group h-full cursor-pointer border-dashed transition-all hover:border-primary hover:shadow-md">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <IconFolderPlus className="size-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">
                        {project.featureCount} features
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
