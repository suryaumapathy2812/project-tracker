"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FolderKanban, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserButton } from "@/components/auth/user-button";
import { useStudent } from "@/lib/providers/student-provider";

export function StudentHeader() {
  const params = useParams();
  const { projects, activeProjectId } = useStudent();

  const currentProject = projects.find((p) => p.id === activeProjectId);
  const hasMultipleProjects = projects.length > 1;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-sm dark:border-stone-800 dark:bg-stone-950/80">
      <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/my" className="flex shrink-0 items-center gap-2 text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-stone-100">
            <FolderKanban className="h-4 w-4" />
          </Link>

          {/* Project selector (only if on a project page and has multiple) */}
          {currentProject && (
            <>
              <span className="shrink-0 text-stone-300 dark:text-stone-700">/</span>

              {hasMultipleProjects ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-w-0 max-w-[200px] gap-1 px-2 font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100 sm:max-w-none"
                    >
                      <span className="truncate">{currentProject.name}</span>
                      <ChevronDown className="h-3 w-3 shrink-0 text-stone-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    {projects.map((project) => (
                      <DropdownMenuItem key={project.id} asChild>
                        <Link
                          href={`/my/${project.id}`}
                          className="flex items-center justify-between"
                        >
                          <span className="font-medium">{project.name}</span>
                          {project.id === activeProjectId && (
                            <Check className="h-4 w-4 text-stone-600" />
                          )}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <span className="truncate text-sm font-medium text-stone-700 dark:text-stone-300">
                  {currentProject.name}
                </span>
              )}
            </>
          )}
        </div>

        {/* User Button */}
        <div className="shrink-0">
          <UserButton />
        </div>
      </div>
    </header>
  );
}
