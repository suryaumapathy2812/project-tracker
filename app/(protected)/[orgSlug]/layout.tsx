import { NavigationBridge } from "@/lib/providers/navigation-bridge";
import { DashboardHeader } from "@/components/layout/dashboard-header";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  // params are available for child components via useParams()
  // OrgProvider in the parent layout handles org validation and state
  await params; // Await to satisfy Next.js

  // NavigationBridge auto-detects org vs batch level from URL params
  return (
    <NavigationBridge>
      <DashboardHeader />
      <main className="w-full px-2 py-6 sm:px-6 lg:px-8">{children}</main>
    </NavigationBridge>
  );
}
