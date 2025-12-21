import {
  IconLoader,
  IconCircle,
  IconCircleDashed,
  IconCircleCheckFilled,
  IconCircleX,
} from "@tabler/icons-react";

export type Status = "Backlog" | "Todo" | "InProgress" | "Done" | "Canceled";

export interface StatusConfigItem {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export const statusConfig: Record<Status, StatusConfigItem> = {
  InProgress: {
    label: "In Progress",
    icon: IconLoader,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
  Todo: {
    label: "Todo",
    icon: IconCircle,
    color: "text-stone-600 dark:text-stone-400",
    bgColor: "bg-stone-100 dark:bg-stone-800",
  },
  Backlog: {
    label: "Backlog",
    icon: IconCircleDashed,
    color: "text-stone-400 dark:text-stone-500",
    bgColor: "bg-stone-50 dark:bg-stone-900",
  },
  Done: {
    label: "Done",
    icon: IconCircleCheckFilled,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
  },
  Canceled: {
    label: "Canceled",
    icon: IconCircleX,
    color: "text-stone-400 dark:text-stone-500",
    bgColor: "bg-stone-100 dark:bg-stone-800",
  },
};

export const statusOrder: Status[] = [
  "InProgress",
  "Todo",
  "Backlog",
  "Done",
  "Canceled",
];

export const allStatuses = Object.keys(statusConfig) as Status[];
