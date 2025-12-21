"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { ac, Admin, PM, Student } from "./auth-permissions";
import type { Session, User, UserRole } from "./auth";

/**
 * Better Auth client instance
 * Configured with organization and admin plugins
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    adminClient(),
    organizationClient({
      ac,
      roles: {
        Admin,
        PM,
        Student,
      },
    }),
  ],
});

// Export auth methods
export const { signIn, signUp, signOut, useSession } = authClient;

// Export types
export type { Session, User, UserRole };

// Re-export the authClient for direct access
export default authClient;
