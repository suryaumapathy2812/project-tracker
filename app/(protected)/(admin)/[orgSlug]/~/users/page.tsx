"use client";

import { useState, useMemo } from "react";
import { Users, MoreHorizontal, Search } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AddMemberDialog } from "@/components/users/add-member-dialog";
import { toast } from "sonner";

const PAGE_SIZE = 10;

type Member = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    batch?: { id: string; name: string } | null;
  };
};

interface UsersTableProps {
  members: Member[];
  availableBatches: { id: string; name: string; slug: string }[];
  onRemove: (userId: string) => void;
  onAssignBatch: (userId: string, batchId: string) => void;
  onRemoveBatch: (userId: string) => void;
  emptyMessage: string;
  showBatchColumn?: boolean;
}

function UsersTable({
  members,
  availableBatches,
  onRemove,
  onAssignBatch,
  onRemoveBatch,
  emptyMessage,
  showBatchColumn = false,
}: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Filter by search
  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members;
    const query = search.toLowerCase();
    return members.filter(
      (m) =>
        m.user.name.toLowerCase().includes(query) ||
        m.user.email.toLowerCase().includes(query)
    );
  }, [members, search]);

  // Paginate
  const paginatedMembers = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, page]);

  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE);

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="size-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No users</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card className="py-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {showBatchColumn && <TableHead>Batch</TableHead>}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showBatchColumn ? 5 : 4} className="h-24 text-center">
                  No users found matching &quot;{search}&quot;
                </TableCell>
              </TableRow>
            ) : (
              paginatedMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.user.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.user.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground capitalize">
                    {member.role.toLowerCase()}
                  </TableCell>
                  {showBatchColumn && (
                    <TableCell>
                      <Select
                        value={member.user.batch?.id || "none"}
                        onValueChange={(value) => {
                          if (value === "none") {
                            onRemoveBatch(member.user.id);
                          } else {
                            onAssignBatch(member.user.id, value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="No batch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No batch</SelectItem>
                          {availableBatches?.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
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
                          onClick={() => onRemove(member.user.id)}
                        >
                          Remove from org
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1} to{" "}
            {Math.min((page + 1) * PAGE_SIZE, filteredMembers.length)} of{" "}
            {filteredMembers.length} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgUsersPage() {
  const { currentOrg, availableBatches } = useNavigation();

  const utils = trpc.useUtils();
  const { data: members, isLoading } = trpc.users.listByOrg.useQuery(
    { orgId: currentOrg?.id || "" },
    { enabled: !!currentOrg?.id }
  );

  const removeFromOrg = trpc.users.removeFromOrg.useMutation({
    onSuccess: () => {
      utils.users.listByOrg.invalidate({ orgId: currentOrg?.id || "" });
      toast.success("User removed from organization");
    },
    onError: (error) => toast.error(error.message),
  });

  const assignBatch = trpc.batches.assignStudent.useMutation({
    onSuccess: () => {
      utils.users.listByOrg.invalidate({ orgId: currentOrg?.id || "" });
      toast.success("Batch assigned");
    },
    onError: (error) => toast.error(error.message),
  });

  const removeBatch = trpc.batches.removeStudent.useMutation({
    onSuccess: () => {
      utils.users.listByOrg.invalidate({ orgId: currentOrg?.id || "" });
      toast.success("Batch removed");
    },
    onError: (error) => toast.error(error.message),
  });

  // Filter members by role (case-insensitive)
  const allMembers = members || [];
  const pmMembers = allMembers.filter((m) => {
    const role = m.role.toLowerCase();
    return role === "admin" || role === "pm";
  });
  const studentMembers = allMembers.filter(
    (m) => m.role.toLowerCase() === "student"
  );

  // Handlers
  const handleRemove = (userId: string) => {
    if (!currentOrg) return;
    removeFromOrg.mutate({ userId, orgId: currentOrg.id });
  };

  const handleAssignBatch = (userId: string, batchId: string) => {
    assignBatch.mutate({ userId, batchId });
  };

  const handleRemoveBatch = (userId: string) => {
    removeBatch.mutate({ userId });
  };

  if (isLoading || !currentOrg) {
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
        <PageHeader title="Users" description={`All users in ${currentOrg.name}`}>
          <AddMemberDialog
            orgId={currentOrg.id}
            availableBatches={availableBatches}
          />
        </PageHeader>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pms">PMs</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <UsersTable
              members={allMembers}
              availableBatches={availableBatches || []}
              onRemove={handleRemove}
              onAssignBatch={handleAssignBatch}
              onRemoveBatch={handleRemoveBatch}
              emptyMessage="Add users to this organization."
            />
          </TabsContent>

          <TabsContent value="pms" className="mt-4">
            <UsersTable
              members={pmMembers}
              availableBatches={availableBatches || []}
              onRemove={handleRemove}
              onAssignBatch={handleAssignBatch}
              onRemoveBatch={handleRemoveBatch}
              emptyMessage="No PMs in this organization."
            />
          </TabsContent>

          <TabsContent value="students" className="mt-4">
            <UsersTable
              members={studentMembers}
              availableBatches={availableBatches || []}
              onRemove={handleRemove}
              onAssignBatch={handleAssignBatch}
              onRemoveBatch={handleRemoveBatch}
              emptyMessage="No students in this organization."
              showBatchColumn
            />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
