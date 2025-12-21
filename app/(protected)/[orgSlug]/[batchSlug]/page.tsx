"use client";

import Link from "next/link";
import {
  Users,
  ClipboardList,
  Layers,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { useSession } from "@/lib/auth-client";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusSelect } from "@/components/features/status-select";

type Status = "Backlog" | "Todo" | "InProgress" | "Done" | "Canceled";

interface GroupedProject {
  project: {
    id: string;
    name: string;
    description: string | null;
    shareId: string;
  };
  features: Array<{
    id: string;
    assignmentId: string;
    title: string;
    description: string;
    tags: string[];
    status: Status;
  }>;
  progress: {
    total: number;
    done: number;
    percentage: number;
  };
}

export default function BatchOverviewPage() {
  const { currentOrg, currentBatch } = useNavigation();
  const { data: session } = useSession();
  const userRole = (
    (session as { activeOrganization?: { role?: string } } | null)
      ?.activeOrganization?.role ||
    (session?.user as { role?: string })?.role ||
    "student"
  ).toLowerCase();

  const isStudent = userRole === "student";

  // Get batch details
  const { data: batch, isLoading } = trpc.batches.getBySlug.useQuery(
    { orgSlug: currentOrg?.slug || "", batchSlug: currentBatch?.slug || "" },
    { enabled: !!currentOrg?.slug && !!currentBatch?.slug },
  );

  // Get assignments for students
  const { data: assignments, isLoading: assignmentsLoading } =
    trpc.assignments.myAssignments.useQuery(undefined, {
      enabled: isStudent,
    });

  // Group assignments by project for students
  const groupedProjects: GroupedProject[] = [];
  if (isStudent && assignments) {
    const projectMap = new Map<string, GroupedProject>();

    for (const assignment of assignments) {
      const projectId = assignment.project.id;
      if (!projectMap.has(projectId)) {
        projectMap.set(projectId, {
          project: assignment.project,
          features: [],
          progress: { total: 0, done: 0, percentage: 0 },
        });
      }

      const group = projectMap.get(projectId)!;
      group.features.push({
        id: assignment.feature.id,
        assignmentId: assignment.id,
        title: assignment.feature.title,
        description: assignment.feature.description,
        tags: assignment.feature.tags,
        status: assignment.status as Status,
      });
    }

    for (const group of projectMap.values()) {
      group.progress.total = group.features.length;
      group.progress.done = group.features.filter(
        (f) => f.status === "Done",
      ).length;
      group.progress.percentage =
        group.progress.total > 0
          ? Math.round((group.progress.done / group.progress.total) * 100)
          : 0;
      groupedProjects.push(group);
    }
  }

  if (isLoading || !currentBatch) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  // Student view - show assignments
  if (isStudent) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <PageHeader
            title="My Assignments"
            description={`${currentBatch.name} - Track your progress`}
          />

          {assignmentsLoading ? (
            <Skeleton className="h-64" />
          ) : groupedProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">
                  No assignments yet
                </h3>
                <p className="text-muted-foreground">
                  You haven&apos;t been assigned to any projects.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {groupedProjects.map((group) => (
                <Card key={group.project.id}>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {group.project.name}
                    </CardTitle>
                    {group.project.description && (
                      <CardDescription>
                        {group.project.description}
                      </CardDescription>
                    )}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {group.progress.done} / {group.progress.total}{" "}
                          features done
                        </span>
                      </div>
                      <Progress
                        value={group.progress.percentage}
                        className="h-2"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="multiple" className="w-full">
                      {group.features.map((feature) => (
                        <AccordionItem key={feature.id} value={feature.id}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex flex-1 items-center justify-between pr-4">
                              <span className="text-left font-medium">
                                {feature.title}
                              </span>
                              <div className="flex items-center gap-2">
                                {feature.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                <StatusSelect
                                  assignmentId={feature.assignmentId}
                                  currentStatus={feature.status}
                                />
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                                {feature.description}
                              </p>
                              {feature.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {feature.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageContainer>
    );
  }

  // Admin/PM view - show batch overview
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader title={currentBatch.name} description="Batch overview" />

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Students</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {batch?._count?.students || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="size-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">-</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="size-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">-</p>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
            <CardDescription>Students in this batch</CardDescription>
          </CardHeader>
          <CardContent>
            {!batch?.students || batch.students.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No students yet</h3>
                <p className="text-muted-foreground">
                  Assign students to this batch.
                </p>
                <Link href={`/${currentOrg?.slug}/${currentBatch.slug}/users`}>
                  <span className="mt-2 text-primary hover:underline">
                    Manage Users
                  </span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {batch.students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {student.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
