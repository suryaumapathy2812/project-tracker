"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  IconLoader,
  IconCircle,
  IconCircleDashed,
  IconCircleCheckFilled,
  IconCircleX,
} from "@tabler/icons-react";
import { trpc } from "@/lib/trpc/client";
import { PageContainer } from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Tiptap from "@/components/ui/tiptap";

type Status = "Backlog" | "Todo" | "InProgress" | "Done" | "Canceled";

const statusConfig: Record<
  Status,
  { label: string; icon: React.ElementType; color: string; bgColor: string }
> = {
  InProgress: {
    label: "In Progress",
    icon: IconLoader,
    color: "text-yellow-600 dark:text-yellow-400",
    bgColor: "bg-yellow-50 dark:bg-yellow-950",
  },
  Todo: {
    label: "Todo",
    icon: IconCircle,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  Backlog: {
    label: "Backlog",
    icon: IconCircleDashed,
    color: "text-gray-500 dark:text-gray-400",
    bgColor: "bg-gray-50 dark:bg-gray-900",
  },
  Done: {
    label: "Done",
    icon: IconCircleCheckFilled,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  Canceled: {
    label: "Canceled",
    icon: IconCircleX,
    color: "text-red-500 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950",
  },
};

const statusOrder: Status[] = [
  "InProgress",
  "Todo",
  "Backlog",
  "Done",
  "Canceled",
];

export default function FeatureDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.projectId as string;
  const assignmentId = params?.assignmentId as string;

  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.assignments.getById.useQuery(
    { id: assignmentId },
    { enabled: !!assignmentId },
  );

  const updateStatus = trpc.assignments.updateStatus.useMutation({
    onSuccess: () => {
      utils.assignments.getById.invalidate({ id: assignmentId });
      utils.assignments.myProjectAssignments.invalidate({ projectId });
      utils.assignments.myProjects.invalidate();
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-8 w-24" />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !data) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-destructive">Failed to load feature</p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => router.push(`/my/${projectId}`)}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to project
          </Button>
        </div>
      </PageContainer>
    );
  }

  const status = data.status as Status;
  const config = statusConfig[status];

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push(`/my/${projectId}`)}
        >
          <ArrowLeft className="size-4" />
          Back to {data.project.name}
        </Button>

        {/* Title - always visible at top */}
        <h1 className="text-xl font-bold sm:text-2xl">{data.feature.title}</h1>

        {/* Two-column layout - Properties first on mobile */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] lg:gap-8">
          {/* Properties - First on mobile, second on desktop */}
          <div className="order-1 space-y-4 lg:order-2">
            <div className="rounded-lg border p-4">
              <h2 className="mb-4 text-sm font-medium">Properties</h2>
              <Separator className="mb-4" />

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Status</label>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    updateStatus.mutate({
                      id: assignmentId,
                      status: value as Status,
                    });
                  }}
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = config.icon;
                          return (
                            <Icon className={cn("size-5", config.color)} />
                          );
                        })()}
                        <span>{config.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOrder
                      .filter((s) => s !== "Canceled")
                      .map((s) => {
                        const cfg = statusConfig[s];
                        const StatusIcon = cfg.icon;
                        return (
                          <SelectItem key={s} value={s}>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={cn("size-5", cfg.color)} />
                              <span>{cfg.label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Feature details - Second on mobile, first on desktop */}
          <div className="order-2 space-y-6 lg:order-1">
            {/* Description */}
            <div className="space-y-2">
              {data.feature.description ? (
                <Tiptap
                  content={data.feature.description}
                  editable={false}
                  className="border-0 bg-muted/30"
                />
              ) : (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    No description provided.
                  </p>
                </div>
              )}
            </div>

            {/* Tags */}
            {data.feature.tags.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.feature.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
