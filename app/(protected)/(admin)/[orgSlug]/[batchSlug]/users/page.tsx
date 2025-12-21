"use client";

import { Users, MoreHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AddMemberDialog } from "@/components/users/add-member-dialog";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pm: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  student: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function BatchUsersPage() {
  const { currentOrg, currentBatch, availableBatches } = useNavigation();

  const utils = trpc.useUtils();

  // Get all org members
  const { data: orgMembers } = trpc.users.listByOrg.useQuery(
    { orgId: currentOrg?.id || "" },
    { enabled: !!currentOrg?.id }
  );

  // Filter to only students in this batch
  const batchStudents =
    orgMembers?.filter(
      (m) => m.role === "student" && m.user.batchId === currentBatch?.id
    ) || [];

  const removeBatch = trpc.batches.removeStudent.useMutation({
    onSuccess: () => {
      utils.users.listByOrg.invalidate({ orgId: currentOrg?.id || "" });
      toast.success("Student removed from batch");
    },
    onError: (error) => toast.error(error.message),
  });

  const isLoading = !currentOrg || !currentBatch;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader title="Students" description={`Students in ${currentBatch.name}`}>
          <AddMemberDialog
            orgId={currentOrg.id}
            availableBatches={availableBatches}
            defaultBatchId={currentBatch.id}
          />
        </PageHeader>

        {batchStudents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="size-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No students yet</h3>
            <p className="text-muted-foreground">
              Add students to this batch.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchStudents.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.user.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.user.email}
                  </TableCell>
                  <TableCell>
                    <Badge className={roleColors[member.role]}>
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            removeBatch.mutate({ userId: member.user.id })
                          }
                        >
                          Remove from batch
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        )}
      </div>
    </PageContainer>
  );
}
