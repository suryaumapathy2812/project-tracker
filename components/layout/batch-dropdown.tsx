"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigation } from "@/lib/contexts/navigation-context";
import { useSession } from "@/lib/auth-client";

export function BatchDropdown() {
  const router = useRouter();
  const { currentOrg, currentBatch, availableBatches, isOrgLevel } =
    useNavigation();
  const { data: session } = useSession();

  const userRole = (
    (session as { activeOrganization?: { role?: string } } | null)
      ?.activeOrganization?.role ||
    (session?.user as { role?: string })?.role ||
    "student"
  ).toLowerCase();

  const isAdmin = userRole === "admin";

  const handleSelectBatch = (batchSlug: string) => {
    if (currentOrg) {
      router.push(`/${currentOrg.slug}/${batchSlug}`);
    }
  };

  const handleGoToOrgLevel = () => {
    if (currentOrg) {
      router.push(`/${currentOrg.slug}`);
    }
  };

  if (!currentOrg) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <span className="max-w-[150px] truncate text-sm font-medium">
            {currentBatch?.name || "All Batches"}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Select Batch
        </DropdownMenuLabel>

        {/* "All Batches" option - goes to org level */}
        <DropdownMenuItem onClick={handleGoToOrgLevel}>
          <span>All Batches</span>
          {isOrgLevel && <Check className="ml-auto h-4 w-4 text-primary" />}
        </DropdownMenuItem>

        {availableBatches.length > 0 && <DropdownMenuSeparator />}

        {availableBatches.map((batch) => (
          <DropdownMenuItem
            key={batch.id}
            onClick={() => handleSelectBatch(batch.slug)}
          >
            <span className="flex-1 truncate">{batch.name}</span>
            {currentBatch?.id === batch.id && (
              <Check className="ml-auto h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create Batch</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
