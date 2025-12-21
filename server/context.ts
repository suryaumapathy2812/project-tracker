import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });

  // Determine active organization from session (Better Auth organization plugin)
  // The activeOrganizationId is stored in session.session, not directly on session
  const activeOrgId = session?.session?.activeOrganizationId || null;

  // Fetch the caller's role for the active org (if any)
  const membership =
    session?.user && activeOrgId
      ? await db.orgMember.findUnique({
          where: { userId_orgId: { userId: session.user.id, orgId: activeOrgId } },
          select: { role: true },
        })
      : null;

  return {
    db,
    session,
    user: session?.user || null,
    req: opts.req,
    activeOrgId,
    activeOrgRole: membership?.role,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
