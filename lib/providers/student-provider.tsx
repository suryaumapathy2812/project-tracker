"use client";

import { useEffect, ReactNode, createContext, useContext, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { Spinner } from "@/components/ui/spinner";

interface StudentProject {
  id: string;
  name: string;
  description: string | null;
  featureCount: number;
  progress: {
    total: number;
    done: number;
    percentage: number;
  };
}

interface StudentContextValue {
  projects: StudentProject[];
  activeProjectId: string | null;
  isLoading: boolean;
}

const StudentContext = createContext<StudentContextValue | null>(null);

export function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("useStudent must be used within StudentProvider");
  }
  return context;
}

interface StudentProviderProps {
  children: ReactNode;
}

export function StudentProvider({ children }: StudentProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const { data: session, isPending: isSessionPending } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get projectId from URL if on /my/[projectId]
  const urlProjectId = params?.projectId as string | undefined;

  // Fetch student's joined projects
  const {
    data: projects,
    isLoading: isProjectsLoading,
    isSuccess: isProjectsSuccess,
  } = trpc.studentProjects.list.useQuery(undefined, {
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Handle session state
  useEffect(() => {
    if (isSessionPending) return;

    if (!session?.user) {
      router.replace("/login");
    }
  }, [session, isSessionPending, router]);

  // Handle project routing
  useEffect(() => {
    if (isSessionPending || isProjectsLoading || !isProjectsSuccess || !projects) {
      return;
    }

    // On /my page, check if we should redirect
    if (pathname === "/my") {
      if (projects.length === 0) {
        // No projects - stay on /my (will show empty state)
        setIsInitialized(true);
      } else if (projects.length === 1) {
        // Single project - redirect directly
        router.replace(`/my/${projects[0].id}`);
      } else {
        // Multiple projects - stay on /my (project selector)
        setIsInitialized(true);
      }
      return;
    }

    // On /my/[projectId] - validate project exists
    if (urlProjectId) {
      const projectExists = projects.some((p) => p.id === urlProjectId);
      if (!projectExists) {
        // Invalid project - redirect to /my
        router.replace("/my");
        return;
      }
      setIsInitialized(true);
    }
  }, [
    isSessionPending,
    isProjectsLoading,
    isProjectsSuccess,
    projects,
    pathname,
    urlProjectId,
    router,
  ]);

  // Show loading while checking session or fetching projects
  if (isSessionPending || (session?.user && (isProjectsLoading || !isInitialized))) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children until we have a valid session
  if (!session?.user) {
    return null;
  }

  return (
    <StudentContext.Provider
      value={{
        projects: projects || [],
        activeProjectId: urlProjectId || null,
        isLoading: isProjectsLoading,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}
