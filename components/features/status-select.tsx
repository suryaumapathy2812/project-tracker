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

type Status = "Backlog" | "Todo" | "InProgress" | "Done" | "Canceled";

interface StatusSelectProps {
  assignmentId: string;
  currentStatus: Status;
  disabled?: boolean;
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  Backlog: {
    label: "Backlog",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  Todo: {
    label: "Todo",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  InProgress: {
    label: "In Progress",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  Done: {
    label: "Done",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  Canceled: {
    label: "Canceled",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

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
          "w-32 border-0 font-medium",
          statusConfig[currentStatus].color
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(statusConfig) as Status[]).map((status) => (
          <SelectItem key={status} value={status}>
            <span className={cn("rounded px-2 py-0.5", statusConfig[status].color)}>
              {statusConfig[status].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusConfig[status].color
      )}
    >
      {statusConfig[status].label}
    </span>
  );
}
