"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

export function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bootstrapOrg = trpc.organizations.bootstrapFromActiveOrg.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Step 1: Sign up the user
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Step 2: Create the organization
      const slug = generateSlug(orgName) + "-" + Date.now().toString(36);
      console.log("[SignUp] Creating organization:", { name: orgName, slug });

      const orgResult = await authClient.organization.create({
        name: orgName,
        slug,
      });
      console.log("[SignUp] Org create result:", orgResult);

      if (orgResult.error) {
        // User created but org failed - still redirect but show warning
        console.error("[SignUp] Failed to create organization:", orgResult.error);
      } else {
        // Set the new org as active
        if (orgResult.data?.id) {
          console.log("[SignUp] Setting org as active:", orgResult.data.id);
          const setActiveResult = await authClient.organization.setActive({
            organizationId: orgResult.data.id,
          });
          console.log("[SignUp] setActive result:", setActiveResult);

          // Bootstrap org + membership inside app DB and set caller as Admin
          console.log("[SignUp] Bootstrapping org...");
          await bootstrapOrg.mutateAsync({
            orgId: orgResult.data.id,
            name: orgResult.data.name || orgName,
            slug: orgResult.data.slug || slug,
            logo: orgResult.data.logo ?? undefined,
          });
          console.log("[SignUp] Bootstrap complete");
        }
      }

      // Wait a moment for session to sync, then redirect
      // The setActive call updates server-side session, but client hooks need time to refetch
      console.log("[SignUp] Waiting for session sync before redirect...");

      // Use window.location for a full page navigation to ensure fresh session state
      // router.push/refresh doesn't always trigger a full refetch of auth hooks
      // Redirect to the new org's page using slug
      const redirectSlug = orgResult?.data?.slug || slug;
      window.location.href = `/${redirectSlug}`;
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Get started with Project Tracker
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              type="text"
              placeholder="Acme Inc."
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Your company or team name
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
