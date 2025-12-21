"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Layers,
  Users,
  FolderKanban,
  MoreHorizontal,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { useSession } from "@/lib/auth-client";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function OrgOverviewPage() {
  const { currentOrg, availableBatches } = useNavigation();
  const { data: session } = useSession();
  const userRole = (
    (session as { activeOrganization?: { role?: string } } | null)
      ?.activeOrganization?.role ||
    (session?.user as { role?: string })?.role ||
    "student"
  ).toLowerCase();
  const isAdmin = userRole === "admin";

  const [createOpen, setCreateOpen] = useState(false);
  const [batchName, setBatchName] = useState("");

  const utils = trpc.useUtils();

  // Get org details with counts
  const { data: org, isLoading } = trpc.organizations.getBySlug.useQuery(
    { slug: currentOrg?.slug || "" },
    { enabled: !!currentOrg?.slug },
  );

  const createBatch = trpc.batches.create.useMutation({
    onSuccess: () => {
      utils.organizations.getBySlug.invalidate({
        slug: currentOrg?.slug || "",
      });
      setCreateOpen(false);
      setBatchName("");
      toast.success("Batch created");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteBatch = trpc.batches.delete.useMutation({
    onSuccess: () => {
      utils.organizations.getBySlug.invalidate({
        slug: currentOrg?.slug || "",
      });
      toast.success("Batch deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim() || !org?.id) return;
    createBatch.mutate({ name: batchName.trim(), orgId: org.id });
  };

  if (isLoading || !currentOrg) {
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

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader title={currentOrg.name} description="Organization overview">
          {isAdmin && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  New Batch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateBatch}>
                  <DialogHeader>
                    <DialogTitle>Create Batch</DialogTitle>
                    <DialogDescription>
                      Create a new batch to group students.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={batchName}
                        onChange={(e) => setBatchName(e.target.value)}
                        placeholder="January 2025"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createBatch.isPending}>
                      {createBatch.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </PageHeader>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Batches</CardTitle>
              <Layers className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{org?._count?.batches || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{org?._count?.members || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <FolderKanban className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{org?._count?.projects || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Batches List */}
        <Card>
          <CardHeader>
            <CardTitle>Batches</CardTitle>
            <CardDescription>
              Select a batch to view students and assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {availableBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Layers className="size-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No batches yet</h3>
                <p className="text-muted-foreground">
                  {isAdmin
                    ? "Create your first batch to group students."
                    : "No batches available."}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="group relative flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <Link
                      href={`/${currentOrg.slug}/${batch.slug}`}
                      className="flex-1"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                          <Layers className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{batch.name}</p>
                          <p className="text-sm text-muted-foreground">
                            View batch details
                          </p>
                        </div>
                      </div>
                    </Link>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${currentOrg.slug}/${batch.slug}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/${currentOrg.slug}/${batch.slug}/users`}
                            >
                              Manage Users
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteBatch.mutate({ id: batch.id })}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
