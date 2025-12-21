"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Tiptap from "@/components/ui/tiptap";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

interface Project {
  id: string;
  name: string;
  description: string | null;
  org: { name: string; logo: string | null };
  features: {
    id: string;
    title: string;
    description: string;
    tags: string[];
  }[];
}

export default function PublicProjectPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const shareId = params?.shareId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const joinProject = trpc.studentProjects.join.useMutation({
    onSuccess: (data) => {
      utils.studentProjects.list.invalidate();
      utils.studentProjects.available.invalidate();
      router.push(`/my/${data.project.id}`);
    },
    onError: (error) => {
      // If unauthorized, redirect to login
      if (error.data?.code === "UNAUTHORIZED") {
        router.push(`/login?redirect=/p/${shareId}`);
      }
    },
  });

  const handleStartProject = () => {
    if (project?.id) {
      joinProject.mutate({ projectId: project.id });
    }
  };

  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await fetch(`/api/public/projects/${shareId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Project not found");
          } else {
            setError("Failed to load project");
          }
          return;
        }
        const data = await res.json();
        setProject(data);
      } catch {
        setError("Failed to load project");
      } finally {
        setIsLoading(false);
      }
    }

    if (shareId) {
      fetchProject();
    }
  }, [shareId]);

  if (isLoading) {
    return (
      <div className="relative min-h-full bg-[#faf9f7] dark:bg-[#0a0a0a]">
        {/* Grain texture */}
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-6 py-12">
          <Skeleton className="h-6 w-24" />
          <div className="mt-12 space-y-4 text-center">
            <Skeleton className="mx-auto h-4 w-32" />
            <Skeleton className="mx-auto h-12 w-64" />
            <Skeleton className="mx-auto h-6 w-48" />
          </div>
          <div className="mt-16 space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="relative flex min-h-full items-center justify-center bg-[#faf9f7] dark:bg-[#0a0a0a]">
        <div className="text-center">
          <h1 className={`${instrumentSerif.className} text-3xl text-stone-900 dark:text-stone-100`}>
            {error || "Project not found"}
          </h1>
          <Button
            variant="ghost"
            className="mt-6"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Go home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full bg-[#faf9f7] dark:bg-[#0a0a0a]">
      {/* Grain texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative lines */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-0 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-stone-300/40 to-stone-300/10 dark:via-stone-600/20 dark:to-stone-600/5" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-12">
        {/* Back button */}
        <Link
          href="/my"
          className="inline-flex items-center gap-2 text-sm text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
        >
          <ArrowLeft className="size-4" />
          Back to projects
        </Link>

        {/* Header */}
        <header className="mt-12 text-center">
          {/* Org name */}
          <div className="mb-6 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500">
            <Building2 className="size-3.5" />
            <span>{project.org.name}</span>
          </div>

          {/* Project title */}
          <h1
            className={cn(
              instrumentSerif.className,
              "text-4xl leading-tight tracking-[-0.02em] text-stone-900 sm:text-5xl dark:text-stone-100"
            )}
          >
            {project.name}
          </h1>

          {/* Description */}
          {project.description && (
            <p className="mt-4 text-lg leading-relaxed text-stone-500 dark:text-stone-400">
              {project.description}
            </p>
          )}

          {/* Feature count */}
          <div className="mt-6">
            <Badge variant="secondary" className="text-xs">
              {project.features.length} {project.features.length === 1 ? "feature" : "features"}
            </Badge>
          </div>

          {/* Decorative divider */}
          <div className="mx-auto my-10 flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-stone-300 dark:to-stone-700" />
            <span className="h-1.5 w-1.5 rotate-45 border border-stone-300 dark:border-stone-700" />
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-stone-300 dark:to-stone-700" />
          </div>
        </header>

        {/* Features list */}
        <section>
          <Accordion type="multiple" className="w-full">
            {project.features.map((feature, index) => (
              <AccordionItem
                key={feature.id}
                value={feature.id}
                className="border-b border-stone-200 dark:border-stone-800"
              >
                <AccordionTrigger className="py-5 hover:no-underline">
                  <div className="flex items-baseline gap-3 text-left">
                    <span className="text-xs font-medium text-stone-300 dark:text-stone-700">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="space-y-1.5">
                      <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                        {feature.title}
                      </h2>
                      {feature.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {feature.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  {feature.description ? (
                    <div className="ml-8">
                      <Tiptap
                        content={feature.description}
                        editable={false}
                        className="border-0 bg-transparent p-0 [&_.tiptap]:text-stone-600 dark:[&_.tiptap]:text-stone-400"
                      />
                    </div>
                  ) : (
                    <p className="ml-8 text-sm text-stone-400 italic">
                      No description provided
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={handleStartProject}
            disabled={joinProject.isPending}
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-full bg-stone-900 px-8 text-[13px] font-medium tracking-wide text-white transition-all duration-300 hover:bg-stone-800 hover:shadow-lg hover:shadow-stone-900/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white dark:hover:shadow-stone-100/10"
          >
            {joinProject.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                Start This Project
                <svg
                  className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-stone-300 dark:text-stone-700">
          Powered by Project Tracker
        </footer>
      </div>
    </div>
  );
}
