"use client";

import Link from "next/link";
import { Layers, FolderKanban } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrgOverviewPage() {
  const { currentOrg } = useNavigation();

  // Get batches with student counts
  const { data: batches, isLoading: batchesLoading } =
    trpc.batches.listByOrg.useQuery(
      { orgId: currentOrg?.id || "" },
      { enabled: !!currentOrg?.id }
    );

  // Get projects with feature counts
  const { data: projects, isLoading: projectsLoading } =
    trpc.projects.listByOrg.useQuery(
      { orgId: currentOrg?.id || "" },
      { enabled: !!currentOrg?.id }
    );

  const isLoading = batchesLoading || projectsLoading;

  if (isLoading || !currentOrg) {
    return (
      <PageContainer>
        <div className="space-y-8">
          <Skeleton className="h-8 w-64" />
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Get first 3 batches and projects
  const displayBatches = batches?.slice(0, 3) || [];
  const displayProjects = projects?.slice(0, 3) || [];

  return (
    <PageContainer>
      <div className="space-y-8">
        <PageHeader
          title={currentOrg.name}
          description="Organization overview"
        />

        {/* Batches Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Batches</h2>
            <Link
              href={`/${currentOrg.slug}/~/batches`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>

          {displayBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <Layers className="size-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No batches yet
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayBatches.map((batch) => {
                const studentCount = batch._count?.students || 0;

                return (
                  <Link
                    key={batch.id}
                    href={`/${currentOrg.slug}/${batch.slug}`}
                  >
                    <Card className="h-full transition-colors hover:bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">{batch.name}</CardTitle>
                        <CardDescription>
                          {studentCount}{" "}
                          {studentCount === 1 ? "student" : "students"}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Projects Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link
              href={`/${currentOrg.slug}/~/projects`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </div>

          {displayProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <FolderKanban className="size-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No projects yet
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayProjects.map((project) => {
                const featureCount = project._count?.features || 0;

                return (
                  <Link
                    key={project.id}
                    href={`/${currentOrg.slug}/~/projects/${project.id}`}
                  >
                    <Card className="h-full transition-colors hover:bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <CardDescription>
                          {featureCount}{" "}
                          {featureCount === 1 ? "feature" : "features"}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
