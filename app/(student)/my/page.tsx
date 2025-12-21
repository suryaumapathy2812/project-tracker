"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, FolderOpen } from "lucide-react";
import { IconFolderPlus, IconCircleDashed } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudent } from "@/lib/providers/student-provider";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";

export default function StudentProjectsPage() {
  const router = useRouter();
  const { projects, isLoading } = useStudent();
  const utils = trpc.useUtils();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  // Fetch available projects
  const { data: availableProjects, isLoading: isAvailableLoading } =
    trpc.studentProjects.available.useQuery();

  // Fetch project preview when selected
  const { data: previewProject, isLoading: isPreviewLoading } =
    trpc.studentProjects.preview.useQuery(
      { projectId: selectedProjectId! },
      { enabled: !!selectedProjectId },
    );

  const joinProject = trpc.studentProjects.join.useMutation({
    onSuccess: (data) => {
      utils.studentProjects.list.invalidate();
      utils.studentProjects.available.invalidate();
      setSelectedProjectId(null);
      router.push(`/my/${data.project.id}`);
    },
  });

  const handleOpenPreview = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleClosePreview = () => {
    setSelectedProjectId(null);
  };

  const handleStartProject = () => {
    if (selectedProjectId) {
      joinProject.mutate({ projectId: selectedProjectId });
    }
  };

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
              <Card
                key={project.id}
                className="group cursor-pointer transition-all hover:border-primary hover:shadow-md"
                onClick={() => handleOpenPreview(project.id)}
              >
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
            ))}
          </div>
        </div>

        <ProjectPreviewDialog
          open={!!selectedProjectId}
          onOpenChange={(open) => !open && handleClosePreview()}
          project={previewProject}
          isLoading={isPreviewLoading}
          onStart={handleStartProject}
          isStarting={joinProject.isPending}
        />
      </PageContainer>
    );
  }

  // Has joined projects
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="My Projects"
          description="Your active projects"
        />

        {/* Joined Projects */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/my/${project.id}`}>
              <Card className="group cursor-pointer transition-all hover:border-primary hover:shadow-md">
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

          {/* Add More Projects Card */}
          {hasAvailable && (
            <Card
              className="group cursor-pointer border-dashed transition-all hover:border-primary hover:shadow-md"
              onClick={() => {
                const firstAvailable = availableProjects?.[0];
                if (firstAvailable) {
                  handleOpenPreview(firstAvailable.id);
                }
              }}
            >
              <CardHeader className="flex h-full items-center justify-center py-8">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Plus className="size-8" />
                  <span className="text-sm font-medium">Add Project</span>
                  <span className="text-xs">
                    {availableProjects?.length} available
                  </span>
                </div>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>

      <ProjectPreviewDialog
        open={!!selectedProjectId}
        onOpenChange={(open) => !open && handleClosePreview()}
        project={previewProject}
        isLoading={isPreviewLoading}
        onStart={handleStartProject}
        isStarting={joinProject.isPending}
      />
    </PageContainer>
  );
}

// Project Preview Dialog Component
interface ProjectPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project:
    | {
        id: string;
        name: string;
        description: string | null;
        features: {
          id: string;
          title: string;
          description: string;
          tags: string[];
        }[];
      }
    | undefined;
  isLoading: boolean;
  onStart: () => void;
  isStarting: boolean;
}

function ProjectPreviewDialog({
  open,
  onOpenChange,
  project,
  isLoading,
  onStart,
  isStarting,
}: ProjectPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl flex flex-col">
        <DialogHeader>
          <DialogTitle>{project?.name || "Loading..."}</DialogTitle>
          <DialogDescription>
            {project?.description || `${project?.features.length || 0} features to work on`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ScrollArea className="flex-1 max-h-[50vh] pr-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Features you&apos;ll be working on:
              </p>
              {project?.features.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <IconCircleDashed className="size-5 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium">{feature.title}</p>
                    {feature.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {feature.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-muted px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onStart} disabled={isLoading || isStarting}>
            {isStarting ? "Starting..." : "Start This Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
