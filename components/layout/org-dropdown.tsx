"use client";

import Link from "next/link";
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

export function OrgDropdown() {
  const router = useRouter();
  const { currentOrg, availableOrgs } = useNavigation();

  const handleSelectOrg = (orgSlug: string) => {
    router.push(`/${orgSlug}`);
  };

  if (!currentOrg) {
    return null;
  }

  // Single org - show name as link
  if (availableOrgs.length <= 1) {
    return (
      <Button variant="ghost" className="px-2" asChild>
        <Link href={`/${currentOrg.slug}`}>
          <span className="max-w-[150px] truncate text-sm font-medium">
            {currentOrg.name}
          </span>
        </Link>
      </Button>
    );
  }

  // Multiple orgs - show name + dropdown
  return (
    <div className="flex items-center gap-1">
      <span className="max-w-[150px] truncate text-sm font-medium">
        {currentOrg.name}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        {availableOrgs.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelectOrg(org.slug)}
          >
            <span className="flex-1 truncate">{org.name}</span>
            {currentOrg.id === org.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Plus className="mr-2 h-4 w-4" />
          <span>Create Organization</span>
        </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
