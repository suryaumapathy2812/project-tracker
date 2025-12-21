import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";
import { db } from "./db";
import { ac, Admin, PM, Student } from "./auth-permissions";

/**
 * User roles in the organization
 * Note: Better Auth returns roles in lowercase
 */
export type UserRole = "admin" | "pm" | "student";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    admin(),
    organization({
      ac,
      roles: {
        Admin,
        PM,
        Student,
      },
      creatorRole: "Admin", // Creator of org becomes Admin
    }),
  ],
});

// Infer types from the auth instance
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

// Extended types with organization context
export interface AuthUser extends User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface ActiveOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  role: UserRole;
  createdAt: Date;
}

export interface AuthSession {
  session: Session["session"];
  user: AuthUser;
}
