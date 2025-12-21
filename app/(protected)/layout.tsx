import { OrgProvider } from "@/lib/providers/org-provider";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // OrgProvider handles:
  // - Session check (redirects to /login if not authenticated)
  // - Fetching user's organizations
  // - Managing active org state via Zustand
  // - Redirecting to first org if no org in URL
  return (
    <OrgProvider>
      <div className="flex-1 overflow-auto">{children}</div>
    </OrgProvider>
  );
}
