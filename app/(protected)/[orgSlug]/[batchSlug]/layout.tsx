import { NavigationBridge } from "@/lib/providers/navigation-bridge";

interface BatchLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string; batchSlug: string }>;
}

export default async function BatchLayout({
  children,
  params,
}: BatchLayoutProps) {
  // params are available for child components via useParams()
  // OrgProvider in the parent layout handles org/batch validation and state
  await params; // Await to satisfy Next.js

  // Note: DashboardHeader is rendered by the parent org layout
  // NavigationBridge auto-detects batch level from URL params
  return (
    <NavigationBridge>
      {children}
    </NavigationBridge>
  );
}
