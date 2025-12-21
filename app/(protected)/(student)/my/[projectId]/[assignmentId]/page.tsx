"use client";

import { useParams, useRouter } from "next/navigation";
import { Instrument_Serif } from "next/font/google";
import { ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { statusConfig, statusOrder, type Status } from "@/lib/status-config";
import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Tiptap from "@/components/ui/tiptap";
import { PageHeader } from "@/components/ui/page-header";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

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
          className="gap-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          onClick={() => router.push(`/my/${projectId}`)}
        >
          <ArrowLeft className="size-4" />
          Back to {data.project.name}
        </Button>

        {/* Title */}
        {/*<h1
          className={cn(
            instrumentSerif.className,
            "text-4xl tracking-[-0.02em] text-stone-900 dark:text-stone-100 sm:text-3xl",
          )}
        >
          {data.feature.title}
        </h1>*/}

        <PageHeader title={data.feature.title} />

        {/* Two-column layout - Properties first on mobile */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px] lg:gap-8">
          {/* Properties - First on mobile, second on desktop */}
          <div className="order-1 space-y-4 lg:order-2">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 dark:border-stone-800 dark:bg-stone-900">
              <h2 className="mb-4 text-sm font-medium text-stone-600 dark:text-stone-400">
                Properties
              </h2>
              <div className="h-px bg-stone-200 dark:bg-stone-800" />

              {/* Status */}
              <div className="mt-4 space-y-2">
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
                    {statusOrder.map((s) => {
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
                  className="border-0 bg-transparent p-0 [&>div]:p-0 [&_.tiptap]:text-stone-600 dark:[&_.tiptap]:text-stone-400"
                />
              ) : (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-sm italic text-stone-400">
                    No description provided.
                  </p>
                </div>
              )}
            </div>

            {/* Tags */}
            {data.feature.tags.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-medium text-stone-500 dark:text-stone-400">
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {data.feature.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-600 dark:bg-stone-800 dark:text-stone-400"
                    >
                      {tag}
                    </span>
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
