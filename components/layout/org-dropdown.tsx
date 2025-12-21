"use client";

import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  // Single org - just show name (no dropdown)
  if (availableOrgs.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-2">
        <Avatar className="h-6 w-6">
          {currentOrg.logo && <AvatarImage src={currentOrg.logo} />}
          <AvatarFallback className="text-xs">
            {currentOrg.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[150px] truncate text-sm font-medium">
          {currentOrg.name}
        </span>
      </div>
    );
  }

  // Multiple orgs - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-6 w-6">
            {currentOrg.logo && <AvatarImage src={currentOrg.logo} />}
            <AvatarFallback className="text-xs">
              {currentOrg.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-[150px] truncate text-sm font-medium">
            {currentOrg.name}
          </span>
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
            className="flex items-center gap-2"
          >
            <Avatar className="h-6 w-6">
              {org.logo && <AvatarImage src={org.logo} />}
              <AvatarFallback className="text-xs">
                {org.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
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
  );
}
