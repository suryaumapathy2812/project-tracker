"use client";

import { useState } from "react";
import { UserPlus, Users, MoreHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pm: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  student: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export default function BatchUsersPage() {
  const { currentOrg, currentBatch } = useNavigation();
  const [addOpen, setAddOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

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

  // Students in org but not in this batch
  const availableStudents =
    orgMembers?.filter(
      (m) =>
        m.role === "student" &&
        (!m.user.batchId || m.user.batchId !== currentBatch?.id)
    ) || [];

  const assignBatch = trpc.batches.assignStudent.useMutation({
    onSuccess: () => {
      utils.users.listByOrg.invalidate({ orgId: currentOrg?.id || "" });
      setAddOpen(false);
      setSelectedUserId("");
      toast.success("Student added to batch");
    },
    onError: (error) => toast.error(error.message),
  });

  const removeBatch = trpc.batches.removeStudent.useMutation({
    onSuccess: () => {
      utils.users.listByOrg.invalidate({ orgId: currentOrg?.id || "" });
      toast.success("Student removed from batch");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleAddStudent = () => {
    if (!selectedUserId || !currentBatch) return;
    assignBatch.mutate({
      userId: selectedUserId,
      batchId: currentBatch.id,
    });
  };

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
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 size-4" />
                Add Student
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Student to Batch</DialogTitle>
              <DialogDescription>
                Select a student to add to {currentBatch.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Student</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStudents.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No available students
                      </SelectItem>
                    ) : (
                      availableStudents.map((member) => (
                        <SelectItem key={member.user.id} value={member.user.id}>
                          {member.user.name} ({member.user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStudent}
                disabled={!selectedUserId || assignBatch.isPending}
              >
                {assignBatch.isPending ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
          </Dialog>
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
