"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { Plus, Copy, ExternalLink, Users } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useSession } from "@/lib/auth-client";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { PageContainer } from "@/components/ui/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { FeatureDataTable } from "@/components/features/feature-data-table";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Tiptap from "@/components/ui/tiptap";

interface Props {
  params: Promise<{ orgSlug: string; projectId: string }>;
}

export default function ProjectDetailPage({ params }: Props) {
  const { projectId } = use(params);
  const { currentOrg } = useNavigation();
  const { data: session } = useSession();
  const userRole = (
    (session as { activeOrganization?: { role?: string } } | null)
      ?.activeOrganization?.role ||
    (session?.user as { role?: string })?.role ||
    "student"
  ).toLowerCase();
  const isPM = userRole === "admin" || userRole === "pm";

  const [featureOpen, setFeatureOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [editingFeature, setEditingFeature] = useState<{
    id: string;
    title: string;
    description: string;
    tags: string[];
  } | null>(null);

  const utils = trpc.useUtils();
  const { data: project, isLoading } = trpc.projects.getById.useQuery({
    id: projectId,
  });

  const createFeature = trpc.features.create.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      setFeatureOpen(false);
      setTitle("");
      setDescription("");
      setTags("");
      toast.success("Feature created");
    },
    onError: (error) => toast.error(error.message),
  });

  const updateFeature = trpc.features.update.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      setEditingFeature(null);
      toast.success("Feature updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteFeature = trpc.features.delete.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id: projectId });
      toast.success("Feature deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreateFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    createFeature.mutate({
      projectId,
      title: title.trim(),
      description: description.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  const handleUpdateFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature) return;
    updateFeature.mutate({
      id: editingFeature.id,
      title: editingFeature.title.trim(),
      description: editingFeature.description.trim(),
      tags: editingFeature.tags,
    });
  };

  const copyShareLink = () => {
    if (!project) return;
    const url = `${window.location.origin}/p/${project.shareId}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  // Reset form when sheet closes
  const handleFeatureOpenChange = (open: boolean) => {
    setFeatureOpen(open);
    if (!open) {
      setTitle("");
      setDescription("");
      setTags("");
    }
  };

  // Reset editing state when sheet closes
  const handleEditOpenChange = (open: boolean) => {
    if (!open) {
      setEditingFeature(null);
    }
  };

  if (isLoading || !currentOrg) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
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
    <PageContainer variant="default">
      <div className="space-y-6">
        <PageHeader
          title={project.name}
          description={
            project.description || `Created by ${project.creator.name}`
          }
        >
          <Button variant="outline" size="sm" onClick={copyShareLink}>
            <Copy className="mr-2 size-4" />
            Copy Link
          </Button>
          <Link href={`/p/${project.shareId}`} target="_blank">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 size-4" />
              Public View
            </Button>
          </Link>
          {isPM && (
            <Link href={`/${currentOrg.slug}/~/projects/${projectId}/assign`}>
              <Button size="sm">
                <Users className="mr-2 size-4" />
                Assign Students
              </Button>
            </Link>
          )}
          {isPM && (
            <Sheet open={featureOpen} onOpenChange={handleFeatureOpenChange}>
              <SheetTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 size-4" />
                  Add Feature
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full max-w-4xl sm:w-[60%] sm:max-w-none overflow-y-auto p-2"
              >
                <form
                  onSubmit={handleCreateFeature}
                  className="flex h-full flex-col"
                >
                  <SheetHeader>
                    <SheetTitle>Add Feature</SheetTitle>
                    <SheetDescription>
                      Add a new feature to this project template.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="User Authentication"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Tiptap
                        content={description}
                        onChange={setDescription}
                        placeholder="Describe the feature requirements, acceptance criteria, and implementation details..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="auth, backend, security"
                      />
                    </div>
                  </div>
                  <SheetFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFeatureOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createFeature.isPending}>
                      {createFeature.isPending ? "Adding..." : "Add Feature"}
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          )}
        </PageHeader>

        {project.features.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">No features yet</p>
            {isPM && (
              <p className="text-sm text-muted-foreground">
                Add features to define the project scope.
              </p>
            )}
          </div>
        ) : (
          <FeatureDataTable
            features={project.features}
            isPM={isPM}
            onEdit={(feature) =>
              setEditingFeature({
                id: feature.id,
                title: feature.title,
                description: feature.description,
                tags: feature.tags,
              })
            }
            onDelete={(id) => deleteFeature.mutate({ id })}
          />
        )}

        {/* Edit Feature Sheet */}
        <Sheet open={!!editingFeature} onOpenChange={handleEditOpenChange}>
          <SheetContent
            side="right"
            className="w-full max-w-4xl p-4 sm:w-[60%] sm:max-w-none overflow-y-auto"
          >
            <form
              onSubmit={handleUpdateFeature}
              className="flex h-full flex-col"
            >
              <SheetHeader>
                <SheetTitle>Edit Feature</SheetTitle>
                <SheetDescription>Update the feature details.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editingFeature?.title || ""}
                    onChange={(e) =>
                      setEditingFeature((prev) =>
                        prev ? { ...prev, title: e.target.value } : null,
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Tiptap
                    content={editingFeature?.description || ""}
                    onChange={(html) =>
                      setEditingFeature((prev) =>
                        prev ? { ...prev, description: html } : null,
                      )
                    }
                    placeholder="Describe the feature requirements..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                  <Input
                    id="edit-tags"
                    value={editingFeature?.tags.join(", ") || ""}
                    onChange={(e) =>
                      setEditingFeature((prev) =>
                        prev
                          ? {
                              ...prev,
                              tags: e.target.value
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean),
                            }
                          : null,
                      )
                    }
                  />
                </div>
              </div>
              <SheetFooter className="w-full flex flex-row justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingFeature(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateFeature.isPending}>
                  {updateFeature.isPending ? "Saving..." : "Save"}
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </PageContainer>
  );
}
