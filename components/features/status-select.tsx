"use client";

import { trpc } from "@/lib/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { statusConfig, allStatuses, type Status } from "@/lib/status-config";

interface StatusSelectProps {
  assignmentId: string;
  currentStatus: Status;
  disabled?: boolean;
}

export function StatusSelect({
  assignmentId,
  currentStatus,
  disabled = false,
}: StatusSelectProps) {
  const utils = trpc.useUtils();
  const updateStatus = trpc.assignments.updateStatus.useMutation({
    onSuccess: () => {
      utils.assignments.myAssignments.invalidate();
    },
  });

  const config = statusConfig[currentStatus];
  const Icon = config.icon;

  return (
    <Select
      value={currentStatus}
      onValueChange={(value) =>
        updateStatus.mutate({ id: assignmentId, status: value as Status })
      }
      disabled={disabled || updateStatus.isPending}
    >
      <SelectTrigger
        className={cn(
          "w-36 gap-2 border-0 font-medium",
          config.bgColor,
          config.color
        )}
      >
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon className="size-4" />
            <span>{config.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {allStatuses.map((status) => {
          const cfg = statusConfig[status];
          const StatusIcon = cfg.icon;
          return (
            <SelectItem key={status} value={status}>
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("size-4", cfg.color)} />
                <span>{cfg.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bgColor,
        config.color
      )}
    >
      <Icon className="size-3.5" />
      {config.label}
    </span>
  );
}
