"use client";

import { useState } from "react";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
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
import { Skeleton } from "@/components/ui/skeleton";

export function OrgSelector() {
  const router = useRouter();

  // Use Better Auth's organization hooks
  const { data: organizations, isPending: orgsLoading } =
    authClient.useListOrganizations();
  const { data: activeOrganization, isPending: activeOrgLoading } =
    authClient.useActiveOrganization();

  const [isChanging, setIsChanging] = useState(false);

  const handleSelectOrg = async (orgId: string) => {
    setIsChanging(true);
    try {
      await authClient.organization.setActive({
        organizationId: orgId,
      });
      // Refresh to update server-side session
      router.refresh();
    } finally {
      setIsChanging(false);
    }
  };

  if (orgsLoading || activeOrgLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  // If no organizations, show a message
  if (!organizations || organizations.length === 0) {
    return (
      <Button variant="ghost" className="flex items-center gap-2 px-2">
        <Plus className="h-4 w-4" />
        <span className="text-sm">Create Organization</span>
      </Button>
    );
  }

  // If only one organization, just show it without dropdown
  if (organizations.length === 1) {
    const org = organizations[0];
    return (
      <div className="flex items-center gap-2 px-2">
        <Avatar className="h-6 w-6 rounded-md">
          {org.logo ? (
            <AvatarImage src={org.logo} alt={org.name} />
          ) : (
            <AvatarFallback className="rounded-md bg-primary/10 text-xs">
              {org.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <span className="max-w-[150px] truncate text-sm font-medium">
          {org.name}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 hover:bg-accent"
          disabled={isChanging}
        >
          <Avatar className="h-6 w-6 rounded-md">
            {activeOrganization?.logo ? (
              <AvatarImage
                src={activeOrganization.logo}
                alt={activeOrganization.name}
              />
            ) : (
              <AvatarFallback className="rounded-md bg-primary/10 text-xs">
                {activeOrganization?.name
                  ? activeOrganization.name.charAt(0).toUpperCase()
                  : "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <span className="max-w-[150px] truncate text-sm font-medium">
            {activeOrganization?.name || "Select Organization"}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>

        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelectOrg(org.id)}
            className="flex items-center gap-2"
          >
            <Avatar className="h-6 w-6 rounded-md">
              {org.logo ? (
                <AvatarImage src={org.logo} alt={org.name} />
              ) : (
                <AvatarFallback className="rounded-md text-xs">
                  {org.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="flex-1 truncate">{org.name}</span>
            {activeOrganization?.id === org.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Create Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
