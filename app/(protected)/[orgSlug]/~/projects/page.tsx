"use client";

import { useState } from "react";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import {
  Plus,
  FolderKanban,
  MoreHorizontal,
  Copy,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function OrgProjectsPage() {
  const { currentOrg } = useNavigation();
  const { data: session } = useSession();
  const userRole = (
    (session as { activeOrganization?: { role?: string } } | null)
      ?.activeOrganization?.role ||
    (session?.user as { role?: string })?.role ||
    "student"
  ).toLowerCase();

  const isPM = userRole === "admin" || userRole === "pm";

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const utils = trpc.useUtils();
  const { data: projects, isLoading } = trpc.projects.listByOrg.useQuery(
    { orgId: currentOrg?.id || "" },
    { enabled: !!currentOrg?.id },
  );

  const createProject = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.listByOrg.invalidate({ orgId: currentOrg?.id || "" });
      setOpen(false);
      setName("");
      setDescription("");
      toast.success("Project created");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => {
      utils.projects.listByOrg.invalidate({ orgId: currentOrg?.id || "" });
      toast.success("Project deleted");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentOrg) return;
    createProject.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      orgId: currentOrg.id,
    });
  };

  const copyShareLink = (shareId: string) => {
    const url = `${window.location.origin}/p/${shareId}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  };

  if (isLoading || !currentOrg) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
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
          title="Projects"
          description={
            isPM ? "Manage project templates" : "Browse available projects"
          }
        >
          {isPM && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreate}>
                  <DialogHeader>
                    <DialogTitle>Create Project</DialogTitle>
                    <DialogDescription>
                      Create a new project template with features.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="E-commerce Platform"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="A full-stack e-commerce application..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProject.isPending}>
                      {createProject.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </PageHeader>

        {projects?.length === 0 ? (
          <Card className="border-stone-200 dark:border-stone-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="size-12 text-stone-300 dark:text-stone-700" />
              <h3
                className={cn(
                  instrumentSerif.className,
                  "mt-4 text-lg tracking-[-0.02em] text-stone-900 dark:text-stone-100"
                )}
              >
                No projects yet
              </h3>
              <p className="text-stone-500 dark:text-stone-400">
                {isPM
                  ? "Create your first project template."
                  : "No projects available in this organization."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects?.map((project) => (
              <Card
                key={project.id}
                className="group relative flex flex-col border-stone-200 transition-all hover:border-stone-300 hover:shadow-sm dark:border-stone-800 dark:hover:border-stone-700"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle
                        className={cn(
                          instrumentSerif.className,
                          "text-xl tracking-wide"
                        )}
                      >
                        <Link
                          href={`/${currentOrg.slug}/~/projects/${project.id}`}
                          className="text-stone-900 transition-colors hover:text-stone-600 dark:text-stone-100 dark:hover:text-stone-300"
                        >
                          {project.name}
                        </Link>
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="mt-1.5 line-clamp-2 text-stone-500 dark:text-stone-400">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    {isPM && (
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
                            <Link
                              href={`/${currentOrg.slug}/~/projects/${project.id}`}
                            >
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/${currentOrg.slug}/~/projects/${project.id}/assign`}
                            >
                              Assign Students
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => copyShareLink(project.shareId)}
                          >
                            <Copy className="mr-2 size-4" />
                            Copy Share Link
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/p/${project.shareId}`}
                              target="_blank"
                            >
                              <ExternalLink className="mr-2 size-4" />
                              Open Public View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              deleteProject.mutate({ id: project.id })
                            }
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="mt-auto pt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-stone-100 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                        {project._count.features}
                      </span>
                      <span className="text-sm text-stone-500 dark:text-stone-400">
                        features
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-stone-100 text-xs font-medium text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                        {project._count.assignments}
                      </span>
                      <span className="text-sm text-stone-500 dark:text-stone-400">
                        students
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
