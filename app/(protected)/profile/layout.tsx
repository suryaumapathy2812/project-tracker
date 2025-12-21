"use client";

import Link from "next/link";
import { FolderKanban, ArrowLeft } from "lucide-react";
import { UserButton } from "@/components/auth/user-button";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#faf9f7] dark:bg-[#0a0a0a]">
        <div className="size-8 animate-pulse rounded-full bg-stone-200 dark:bg-stone-800" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/80">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link
              href="/my"
              className="flex items-center gap-2 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100"
            >
              <FolderKanban className="h-4 w-4" />
            </Link>

            <span className="text-stone-300 dark:text-stone-700">/</span>

            <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Profile
            </span>
          </div>

          {/* User Button */}
          <UserButton />
        </div>
      </header>

      <div className="relative flex-1 overflow-auto bg-[#faf9f7] dark:bg-[#0a0a0a]">
        {/* Grain texture */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}
