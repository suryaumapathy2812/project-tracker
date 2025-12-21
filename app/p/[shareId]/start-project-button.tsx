"use client";

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface StartProjectButtonProps {
  projectId: string;
  shareId: string;
}

export function StartProjectButton({
  projectId,
  shareId,
}: StartProjectButtonProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const joinProject = trpc.studentProjects.join.useMutation({
    onSuccess: (data) => {
      utils.studentProjects.list.invalidate();
      utils.studentProjects.available.invalidate();
      router.push(`/my/${data.project.id}`);
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED") {
        router.push(`/login?redirect=/p/${shareId}`);
      }
    },
  });

  return (
    <button
      onClick={() => joinProject.mutate({ projectId })}
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </>
      )}
    </button>
  );
}
