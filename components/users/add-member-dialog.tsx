"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
  slug: string;
}

interface AddMemberDialogProps {
  orgId: string;
  availableBatches?: Batch[];
  defaultBatchId?: string;
  onSuccess?: () => void;
}

export function AddMemberDialog({
  orgId,
  availableBatches = [],
  defaultBatchId,
  onSuccess,
}: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "pm" | "student">("student");
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId || "none");

  const utils = trpc.useUtils();

  // Reset batch when defaultBatchId changes
  useEffect(() => {
    if (defaultBatchId) {
      setSelectedBatchId(defaultBatchId);
    }
  }, [defaultBatchId]);

  const addMemberByEmail = trpc.users.addMemberByEmail.useMutation({
    onSuccess: async (data) => {
      // If role is student and a valid batch is selected, assign to batch
      if (role === "student" && selectedBatchId && selectedBatchId !== "none" && data.user) {
        await assignBatch.mutateAsync({
          userId: data.user.id,
          batchId: selectedBatchId,
        });
      }
      utils.users.listByOrg.invalidate({ orgId });
      handleClose();
      toast.success("Member added successfully");
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message || "Failed to add member"),
  });

  const assignBatch = trpc.batches.assignStudent.useMutation({
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    addMemberByEmail.mutate({
      email: email.trim(),
      name: name.trim() || undefined,
      orgId,
      role,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setName("");
    setRole("student");
    setSelectedBatchId(defaultBatchId || "none");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!addMemberByEmail.isPending) {
      if (newOpen) {
        setOpen(true);
      } else {
        handleClose();
      }
    }
  };

  const isPending = addMemberByEmail.isPending || assignBatch.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 size-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Enter an email to add a member. If the user doesn&apos;t exist, a new account will be created.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                disabled={isPending}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                If not provided, the email username will be used
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: "admin" | "pm" | "student") => setRole(value)}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="pm">PM</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "student" && availableBatches.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="batch">Batch (optional)</Label>
                <Select
                  value={selectedBatchId}
                  onValueChange={setSelectedBatchId}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No batch</SelectItem>
                    {availableBatches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!email.trim() || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
