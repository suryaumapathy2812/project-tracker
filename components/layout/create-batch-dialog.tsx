"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc/client";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { toast } from "sonner";

interface CreateBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBatchDialog({ open, onOpenChange }: CreateBatchDialogProps) {
  const [name, setName] = useState("");
  const { currentOrg } = useNavigation();
  const utils = trpc.useUtils();

  const createBatch = trpc.batches.create.useMutation({
    onSuccess: (batch) => {
      // Invalidate relevant queries
      utils.batches.listByOrgSlug.invalidate({ orgSlug: currentOrg?.slug || "" });
      utils.organizations.getBySlug.invalidate({ slug: currentOrg?.slug || "" });

      onOpenChange(false);
      setName("");
      toast.success(`Batch "${batch.name}" created successfully`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create batch");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?.id || !name.trim()) return;
    createBatch.mutate({ name: name.trim(), orgId: currentOrg.id });
  };

  const handleClose = () => {
    if (!createBatch.isPending) {
      onOpenChange(false);
      setName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Batch</DialogTitle>
            <DialogDescription>
              Create a new batch in {currentOrg?.name} to group students.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="batch-name">Batch Name</Label>
              <Input
                id="batch-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
              disabled={!name.trim() || createBatch.isPending}
            >
              {createBatch.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Batch"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
