"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Layers, Loader2 } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Instrument_Serif } from "next/font/google";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function BatchesPage() {
  const { currentOrg, availableBatches } = useNavigation();
  const [createOpen, setCreateOpen] = useState(false);
  const [batchName, setBatchName] = useState("");

  const utils = trpc.useUtils();

  // Get org details
  const { data: org } = trpc.organizations.getBySlug.useQuery(
    { slug: currentOrg?.slug || "" },
    { enabled: !!currentOrg?.slug },
  );

  // Get batches with student counts
  const { data: batchesWithCounts, isLoading } =
    trpc.batches.listByOrg.useQuery(
      { orgId: currentOrg?.id || "" },
      { enabled: !!currentOrg?.id },
    );

  const createBatch = trpc.batches.create.useMutation({
    onSuccess: () => {
      utils.organizations.getBySlug.invalidate({
        slug: currentOrg?.slug || "",
      });
      utils.batches.listByOrg.invalidate({ orgId: currentOrg?.id || "" });
      utils.batches.listByOrgSlug.invalidate({
        orgSlug: currentOrg?.slug || "",
      });
      setCreateOpen(false);
      setBatchName("");
      toast.success("Batch created");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchName.trim() || !org?.id) return;
    createBatch.mutate({ name: batchName.trim(), orgId: org.id });
  };

  const handleClose = () => {
    if (!createBatch.isPending) {
      setCreateOpen(false);
      setBatchName("");
    }
  };

  if (isLoading || !currentOrg) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <PageHeader
          title="Batches"
          description={`Manage batches in ${currentOrg.name}`}
        >
          <Dialog open={createOpen} onOpenChange={handleClose}>
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
                    <Label htmlFor="name">Batch Name</Label>
                    <Input
                      id="name"
                      value={batchName}
                      onChange={(e) => setBatchName(e.target.value)}
                      placeholder="e.g., Spring 2025"
                      disabled={createBatch.isPending}
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={createBatch.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!batchName.trim() || createBatch.isPending}
                  >
                    {createBatch.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </PageHeader>

        {/* Batches Grid */}
        {!batchesWithCounts || batchesWithCounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Layers className="size-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No batches yet</h3>
              <p className="text-muted-foreground">
                Create your first batch to group students.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {batchesWithCounts.map((batch) => {
              const studentCount = batch._count?.students || 0;

              return (
                <Link key={batch.id} href={`/${currentOrg.slug}/${batch.slug}`}>
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle>{batch.name}</CardTitle>
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
      </div>
    </PageContainer>
  );
}
