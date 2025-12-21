"use client";

import { Spinner } from "@/components/ui/spinner";

/**
 * Redirect page - shown briefly while OrgProvider determines
 * which org to redirect the user to after login.
 */
export default function RedirectPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
