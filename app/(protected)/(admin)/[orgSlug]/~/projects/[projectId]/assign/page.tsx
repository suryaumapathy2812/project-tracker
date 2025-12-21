"use client";

import { use, useState } from "react";
import Link from "next/link";
import { UserPlus, UserMinus, Users, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Props {
  params: Promise<{ orgSlug: string; projectId: string }>;
}

export default function AssignPage({ params }: Props) {
  const { projectId } = use(params);
  const { currentOrg, availableBatches } = useNavigation();
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );

  const utils = trpc.useUtils();
  const { data: project, isLoading: projectLoading } =
    trpc.projects.getById.useQuery({
      id: projectId,
    });
  const { data: assignedStudents } = trpc.assignments.getAssignedStudents.useQuery(
    {
      projectId,
    }
  );
  const { data: orgStudents } = trpc.users.listStudentsByOrg.useQuery(
    { orgId: currentOrg?.id || "" },
    { enabled: !!currentOrg?.id }
  );

  const bulkAssign = trpc.assignments.bulkAssign.useMutation({
    onSuccess: () => {
      utils.assignments.getAssignedStudents.invalidate({ projectId });
      utils.assignments.listByProject.invalidate({ projectId });
      utils.projects.getById.invalidate({ id: projectId });
      setSelectedStudents(new Set());
      toast.success("Students assigned successfully");
    },
    onError: (error) => toast.error(error.message),
  });

  const removeStudent = trpc.assignments.removeStudentFromProject.useMutation({
    onSuccess: () => {
      utils.assignments.getAssignedStudents.invalidate({ projectId });
      utils.assignments.listByProject.invalidate({ projectId });
      utils.projects.getById.invalidate({ id: projectId });
      toast.success("Student removed from project");
    },
    onError: (error) => toast.error(error.message),
  });

  const assignedIds = new Set(assignedStudents?.map((s) => s.id) || []);

  // Filter students by batch and exclude already assigned
  const availableStudents =
    orgStudents?.filter((m) => {
      if (assignedIds.has(m.user.id)) return false;
      if (selectedBatch === "all") return true;
      if (selectedBatch === "none") return !m.user.batchId;
      return m.user.batchId === selectedBatch;
    }) || [];

  const toggleStudent = (id: string) => {
    const next = new Set(selectedStudents);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedStudents(next);
  };

  const selectAll = () => {
    setSelectedStudents(new Set(availableStudents.map((m) => m.user.id)));
  };

  const clearSelection = () => {
    setSelectedStudents(new Set());
  };

  const handleAssign = () => {
    if (selectedStudents.size === 0) return;
    bulkAssign.mutate({
      projectId,
      studentIds: Array.from(selectedStudents),
    });
  };

  if (projectLoading || !currentOrg) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!project) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold">Project not found</h2>
          <Link href={`/${currentOrg.slug}/~/projects`}>
            <Button variant="link">Back to projects</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader title="Assign Students" description={project.name} />

        {project.features.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium">No features in this project</p>
            <p className="text-muted-foreground">
              Add features before assigning students.
            </p>
            <Link href={`/${currentOrg.slug}/~/projects/${projectId}`}>
              <Button className="mt-4">Add Features</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Available Students */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Available Students</CardTitle>
                  <CardDescription>
                    {availableStudents.length} student
                    {availableStudents.length !== 1 ? "s" : ""} available
                  </CardDescription>
                </div>
                <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All batches</SelectItem>
                    <SelectItem value="none">No batch</SelectItem>
                    {availableBatches?.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {availableStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    No available students
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={selectAll}>
                      Select All
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                  <div className="max-h-80 space-y-2 overflow-y-auto">
                    {availableStudents.map((member) => (
                      <div
                        key={member.user.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <Checkbox
                          checked={selectedStudents.has(member.user.id)}
                          onCheckedChange={() => toggleStudent(member.user.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{member.user.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.user.email}
                          </p>
                        </div>
                        {member.user.batch && (
                          <Badge variant="secondary">
                            {member.user.batch.name}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <Button
                      className="w-full"
                      onClick={handleAssign}
                      disabled={
                        selectedStudents.size === 0 || bulkAssign.isPending
                      }
                    >
                      <UserPlus className="mr-2 size-4" />
                      {bulkAssign.isPending
                        ? "Assigning..."
                        : `Assign ${selectedStudents.size} Student${selectedStudents.size !== 1 ? "s" : ""}`}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Assigned Students */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Students</CardTitle>
              <CardDescription>
                {assignedStudents?.length || 0} student
                {assignedStudents?.length !== 1 ? "s" : ""} assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!assignedStudents || assignedStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="size-8 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    No students assigned yet
                  </p>
                </div>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {assignedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() =>
                          removeStudent.mutate({
                            projectId,
                            studentId: student.id,
                          })
                        }
                        disabled={removeStudent.isPending}
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </PageContainer>
  );
}
