import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
} from "better-auth/plugins/organization/access";

/**
 * Access Control Configuration for Organization Roles
 *
 * This defines the permissions system for the application.
 * Roles are assigned per-organization (stored in Member.role).
 */

// Define permission statements (resources and their actions)
const statement = {
  ...defaultStatements, // organization, member, invitation
  project: ["create", "read", "update", "delete", "assign"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Admin Role
 * - Full organization control
 * - Can manage all members and projects
 * - Can manage organization settings
 */
export const Admin = ac.newRole({
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  project: ["create", "read", "update", "delete", "assign"],
});

/**
 * PM (Project Manager) Role
 * - Can create and manage projects
 * - Can invite members
 * - Cannot delete organization or manage org settings
 */
export const PM = ac.newRole({
  member: ["create"],
  invitation: ["create"],
  project: ["create", "read", "update", "delete", "assign"],
});

/**
 * Student Role
 * - Read-only access to assigned projects
 * - Cannot manage members or organization
 */
export const Student = ac.newRole({
  project: ["read"],
});
