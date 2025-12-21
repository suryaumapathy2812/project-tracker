"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

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
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="animate-fade-in-up mb-8 text-center">
        <h1
          className={`${instrumentSerif.className} text-3xl tracking-[-0.02em] text-stone-900 dark:text-stone-100`}
        >
          Create an account
        </h1>
        <p className="mt-2 text-[15px] text-stone-500 dark:text-stone-400">
          Get started with Project Tracker
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="animate-fade-in-up-1 w-full space-y-5"
      >
        <div className="space-y-1.5">
          <label
            htmlFor="name"
            className="text-[13px] font-medium text-stone-600 dark:text-stone-400"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-4 text-[15px] text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-stone-800"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-[13px] font-medium text-stone-600 dark:text-stone-400"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-4 text-[15px] text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-stone-800"
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="text-[13px] font-medium text-stone-600 dark:text-stone-400"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            minLength={8}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-4 text-[15px] text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-stone-800"
          />
          <p className="text-[11px] text-stone-400 dark:text-stone-500">
            Must be at least 8 characters
          </p>
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="orgName"
            className="text-[13px] font-medium text-stone-600 dark:text-stone-400"
          >
            Organization Name
          </label>
          <input
            id="orgName"
            type="text"
            placeholder="Acme Inc."
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            disabled={isLoading}
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-4 text-[15px] text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-600 dark:focus:ring-stone-800"
          />
          <p className="text-[11px] text-stone-400 dark:text-stone-500">
            Your company or team name
          </p>
        </div>

        {error && (
          <p className="text-[13px] text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="h-11 w-full rounded-full bg-stone-900 text-[13px] font-medium tracking-wide text-white transition-all duration-300 hover:bg-stone-800 hover:shadow-lg hover:shadow-stone-900/20 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white dark:hover:shadow-stone-100/10"
        >
          {isLoading ? (
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="animate-fade-in-up-2 mt-8 text-center text-[13px] text-stone-500 dark:text-stone-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-stone-700 underline underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
