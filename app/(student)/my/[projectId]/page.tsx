"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { Plus, Trash2 } from "lucide-react";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
import {
  IconCaretDownFilled,
  IconCaretRightFilled,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { statusConfig, statusOrder, type Status } from "@/lib/status-config";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Item, ItemContent, ItemTitle } from "@/components/ui/item";
import { Empty, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import Tiptap from "@/components/ui/tiptap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface FeatureRowProps {
  assignment: {
    id: string;
    status: string;
    feature: {
      id: string;
      title: string;
      description: string;
      tags: string[];
    };
  };
  projectId: string;
}

function FeatureRow({ assignment, projectId }: FeatureRowProps) {
  return (
    <Link
      href={`/my/${projectId}/${assignment.id}`}
      className="block rounded-lg border border-white/60 bg-white/80 px-3 py-2.5 transition-all hover:border-stone-200 hover:bg-white hover:shadow-sm dark:border-stone-800/60 dark:bg-stone-900/50 dark:hover:border-stone-700 dark:hover:bg-stone-800/80"
    >
      <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
        {assignment.feature.title}
      </span>
    </Link>
  );
}

interface AvailableFeature {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

// Onboarding component for new students with no assignments
interface OnboardingFeatureListProps {
  features: AvailableFeature[];
  projectId: string;
}

function OnboardingFeatureList({
  features,
  projectId,
}: OnboardingFeatureListProps) {
  const utils = trpc.useUtils();
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedFeature = features.find((f) => f.id === selectedFeatureId);

  const takeFeature = trpc.assignments.takeFeature.useMutation({
    onSuccess: () => {
      utils.studentProjects.getById.invalidate({ projectId });
      utils.studentProjects.list.invalidate();
      setSheetOpen(false);
      setSelectedFeatureId(null);
    },
  });

  const handleTakeFeature = (status: Status) => {
    if (!selectedFeatureId) return;
    takeFeature.mutate({
      projectId,
      featureId: selectedFeatureId,
      status,
    });
  };

  const openFeatureSheet = (featureId: string) => {
    setSelectedFeatureId(featureId);
    setSheetOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-6 dark:border-stone-800 dark:bg-stone-900">
          <h2
            className={`${instrumentSerif.className} text-3xl tracking-[-0.02em] text-stone-900 dark:text-stone-100`}
          >
            Welcome to your project!
          </h2>
          <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
            Pick features below to start working on them. Click a feature to
            view details and add it to your list.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Available Features ({features.length})
          </h3>
          <div className="space-y-1">
            {features.map((feature) => {
              const BacklogIcon = statusConfig.Backlog.icon;
              return (
                <Item
                  key={feature.id}
                  size="sm"
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openFeatureSheet(feature.id)}
                >
                  <BacklogIcon className="size-5 text-muted-foreground" />
                  <ItemContent>
                    <ItemTitle>{feature.title}</ItemTitle>
                  </ItemContent>
                  <Plus className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </Item>
              );
            })}
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full max-w-full flex-col gap-0 sm:max-w-[40%]">
          <SheetHeader className="mb-0">
            <SheetTitle>{selectedFeature?.title}</SheetTitle>
            <SheetDescription>
              Choose a status to add this feature to your list
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-2 py-4">
            {selectedFeature?.description ? (
              <Tiptap
                content={selectedFeature.description}
                editable={false}
                className="border-0 bg-transparent p-0"
              />
            ) : (
              <p className="text-sm italic text-muted-foreground">
                No description provided.
              </p>
            )}
          </div>

          <SheetFooter className="flex-col gap-2 sm:flex-col">
            {(() => {
              const InProgressIcon = statusConfig.InProgress.icon;
              const BacklogIcon = statusConfig.Backlog.icon;
              return (
                <>
                  <Button
                    className="w-full"
                    onClick={() => handleTakeFeature("InProgress")}
                    disabled={takeFeature.isPending}
                  >
                    <InProgressIcon className="size-4" />
                    {takeFeature.isPending ? "Adding..." : "Start Working"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleTakeFeature("Backlog")}
                    disabled={takeFeature.isPending}
                  >
                    <BacklogIcon className="size-4" />
                    Add to Backlog
                  </Button>
                </>
              );
            })()}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface StatusGroupProps {
  status: Status;
  assignments: FeatureRowProps["assignment"][];
  projectId: string;
  defaultOpen?: boolean;
  availableFeatures: AvailableFeature[];
}

function StatusGroup({
  status,
  assignments,
  projectId,
  defaultOpen = true,
  availableFeatures,
}: StatusGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(
    null,
  );
  const utils = trpc.useUtils();
  const config = statusConfig[status];
  const Icon = config.icon;

  const selectedFeature = availableFeatures.find(
    (f) => f.id === selectedFeatureId,
  );

  const takeFeature = trpc.assignments.takeFeature.useMutation({
    onSuccess: () => {
      utils.studentProjects.getById.invalidate({ projectId });
      utils.studentProjects.list.invalidate();
      setSheetOpen(false);
      setSelectedFeatureId(null);
    },
  });

  const handleTakeFeature = () => {
    if (!selectedFeatureId) return;
    takeFeature.mutate({
      projectId,
      featureId: selectedFeatureId,
      status,
    });
  };

  // Show group even if empty when there are available features (so user can add)
  const showGroup = assignments.length > 0 || availableFeatures.length > 0;

  if (!showGroup) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "rounded-xl border p-3",
          status === "InProgress" &&
            "border-amber-300 bg-amber-50/30 dark:border-amber-700 dark:bg-amber-950/20",
          status === "Todo" &&
            "border-stone-300 bg-stone-50/50 dark:border-stone-600 dark:bg-stone-900/50",
          status === "Backlog" &&
            "border-stone-300 bg-stone-50/30 dark:border-stone-700 dark:bg-stone-900/30",
          status === "Done" &&
            "border-emerald-300 bg-emerald-50/30 dark:border-emerald-700 dark:bg-emerald-950/20",
          status === "Canceled" &&
            "border-stone-300 bg-stone-50/20 dark:border-stone-700 dark:bg-stone-900/20",
        )}
      >
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex items-center gap-2">
            <CollapsibleTrigger className="flex flex-1 items-center gap-4 rounded-lg px-2 py-2 hover:bg-muted/50">
            {isOpen ? (
              <IconCaretDownFilled className="size-4 text-muted-foreground" />
            ) : (
              <IconCaretRightFilled className="size-4 text-muted-foreground" />
            )}
            <Icon className={cn("size-5", config.color)} />
            <span className="font-medium">{config.label}</span>
            <span className="text-sm text-muted-foreground">
              ({assignments.length})
            </span>
          </CollapsibleTrigger>
          {availableFeatures.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setSheetOpen(true);
              }}
            >
              <Plus className="size-4" />
            </Button>
          )}
        </div>
        <CollapsibleContent className="pt-3">
          {assignments.length > 0 ? (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <FeatureRow
                  key={assignment.id}
                  assignment={assignment}
                  projectId={projectId}
                />
              ))}
            </div>
          ) : availableFeatures.length > 0 ? (
            <Empty className="py-4 border-0 gap-3">
              <EmptyDescription>No features yet</EmptyDescription>
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSheetOpen(true)}
                >
                  <Plus className="size-4" />
                  Add Feature
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Empty className="py-4 border-0">
              <EmptyDescription>No features</EmptyDescription>
            </Empty>
          )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex flex-col w-full max-w-full sm:max-w-[40%] gap-0">
          <SheetHeader className="mb-0">
            <SheetTitle>Add Feature</SheetTitle>
            <SheetDescription>
              Select a feature to add to{" "}
              <span className="font-medium">{config.label}</span>
            </SheetDescription>

            <div className="mt-4">
              <Select
                value={selectedFeatureId || ""}
                onValueChange={setSelectedFeatureId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a feature..." />
                </SelectTrigger>
                <SelectContent>
                  {availableFeatures.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-2">
            {selectedFeature && (
              <>
                {selectedFeature.description ? (
                  <Tiptap
                    content={selectedFeature.description}
                    editable={false}
                    className="border-0 bg-transparent p-0"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No description provided.
                  </p>
                )}
              </>
            )}
          </div>

          <SheetFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleTakeFeature}
              disabled={!selectedFeatureId || takeFeature.isPending}
            >
              {takeFeature.isPending ? "Adding..." : `Add to ${config.label}`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function StudentProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const { data, isLoading, error } = trpc.studentProjects.getById.useQuery(
    { projectId },
    { enabled: !!projectId },
  );

  const utils = trpc.useUtils();

  const leaveProject = trpc.studentProjects.leave.useMutation({
    onSuccess: () => {
      utils.studentProjects.list.invalidate();
      router.push("/my");
    },
  });

  const confirmationWord = "hasta la vista";
  const canLeave = confirmText === confirmationWord;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-2 w-full" />
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-destructive">Failed to load project</p>
        </div>
      </PageContainer>
    );
  }

  if (!data) {
    return null;
  }

  const { project, assignments, availableFeatures } = data;

  // Check if student has any assignments
  const totalAssignments = statusOrder.reduce(
    (sum, status) => sum + (assignments[status]?.length || 0),
    0,
  );
  const hasNoAssignments = totalAssignments === 0;
  const hasAvailableFeatures = availableFeatures.length > 0;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1
                className={`${instrumentSerif.className} text-2xl tracking-[-0.02em] text-stone-900 dark:text-stone-100 sm:text-3xl`}
              >
                {project.name}
              </h1>
              {project.description && (
                <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 sm:text-base">
                  {project.description}
                </p>
              )}
            </div>

            <AlertDialog
              open={leaveDialogOpen}
              onOpenChange={setLeaveDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Project</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all your assignments from this project.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-4">
                  <p className="text-sm">
                    Type{" "}
                    <span className="font-mono font-bold">
                      {confirmationWord}
                    </span>{" "}
                    to confirm:
                  </p>
                  <Input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={confirmationWord}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmText("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!canLeave || leaveProject.isPending}
                    onClick={() => leaveProject.mutate({ projectId })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {leaveProject.isPending ? "Leaving..." : "Leave Project"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Onboarding: No assignments yet */}
        {hasNoAssignments && hasAvailableFeatures && (
          <OnboardingFeatureList
            features={availableFeatures}
            projectId={projectId}
          />
        )}

        {/* Onboarding: No assignments and no features available */}
        {hasNoAssignments && !hasAvailableFeatures && (
          <Empty className="min-h-[40vh]">
            <EmptyDescription>
              No features available in this project yet. Check back later.
            </EmptyDescription>
          </Empty>
        )}

        {/* Features grouped by status (when has assignments) */}
        {!hasNoAssignments && (
          <div className="space-y-4">
            {statusOrder.map((status) => (
              <StatusGroup
                key={status}
                status={status}
                assignments={assignments[status]}
                projectId={projectId}
                defaultOpen={status === "InProgress"}
                availableFeatures={availableFeatures}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
