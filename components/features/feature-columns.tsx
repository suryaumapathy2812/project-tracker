"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export type Feature = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  createdAt: Date;
  assignments: { id: string; student: { id: string; name: string } }[];
};

interface ColumnOptions {
  isPM: boolean;
  onEdit: (feature: Feature) => void;
  onDelete: (id: string) => void;
}

export function getFeatureColumns({
  isPM,
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<Feature>[] {
  return [
    {
      accessorKey: "title",
      header: "Feature",
      cell: ({ row }) => {
        const feature = row.original;
        return (
          <div className="flex justify-between items-center">
            <span className="font-medium">{feature.title}</span>
            {/* Mobile: show chevron indicator */}
            <ChevronRight className="size-4 text-muted-foreground sm:hidden" />
            {/* Desktop: show Open button for PMs */}
            {isPM && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(feature)}
                className="hidden sm:inline-flex"
              >
                Open
              </Button>
            )}
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return row
          .getValue<string>(id)
          .toLowerCase()
          .includes(value.toLowerCase());
      },
    },
    {
      accessorKey: "tags",
      header: () => <div className="text-right hidden sm:block">Tags</div>,
      size: 180,
      meta: { className: "hidden sm:table-cell" },
      cell: ({ row }) => {
        const tags = row.original.tags;
        const maxTags = 3;
        const visibleTags = tags.slice(0, maxTags);
        const remainingCount = tags.length - maxTags;

        return (
          <div className="flex flex-wrap justify-end gap-1">
            {visibleTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-[11px]">
                {tag}
              </Badge>
            ))}
            {remainingCount > 0 && (
              <Badge variant="outline" className="px-1.5 py-0 text-[11px] text-muted-foreground">
                +{remainingCount}
              </Badge>
            )}
          </div>
        );
      },
      filterFn: (row, id, value: string[]) => {
        if (!value || value.length === 0) return true;
        const tags = row.original.tags;
        return value.some((v) => tags.includes(v));
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right hidden sm:block">Actions</div>,
      size: 100,
      enableResizing: false,
      meta: { className: "hidden sm:table-cell" },
      cell: ({ row }) => {
        const feature = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            {!isPM && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(feature)}
              >
                Open
              </Button>
            )}

            {isPM && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Feature</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete &quot;{feature.title}
                      &quot;? This action cannot be undone and will remove all
                      associated assignments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => onDelete(feature.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        );
      },
    },
  ];
}
