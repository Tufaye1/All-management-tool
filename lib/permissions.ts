import type { WorkspaceRole } from "./types";

/**
 * Permission actions used across the app.
 * Grouped by domain for readability.
 */
export type Permission =
  // Clients
  | "clients:read"
  | "clients:write"
  // Projects
  | "projects:read"
  | "projects:write"
  // Tasks
  | "tasks:read"
  | "tasks:write_own"
  | "tasks:write_all"
  // Finance
  | "finance:read"
  | "finance:write"
  // Team
  | "team:read"
  | "team:invite"
  | "team:manage"
  // Dashboard
  | "dashboard:read";

const PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  admin: [
    "clients:read", "clients:write",
    "projects:read", "projects:write",
    "tasks:read", "tasks:write_own", "tasks:write_all",
    "finance:read", "finance:write",
    "team:read", "team:invite", "team:manage",
    "dashboard:read",
  ],
  account_lead: [
    "clients:read", "clients:write",
    "projects:read", "projects:write",
    "tasks:read", "tasks:write_own", "tasks:write_all",
    "team:read",
    "dashboard:read",
  ],
  team_member: [
    "clients:read",
    "projects:read",
    "tasks:read", "tasks:write_own",
    "team:read",
    "dashboard:read",
  ],
  finance: [
    "clients:read",
    "projects:read",
    "tasks:read",
    "finance:read", "finance:write",
    "team:read",
    "dashboard:read",
  ],
  viewer: [
    "clients:read",
    "projects:read",
    "tasks:read",
    "team:read",
    "dashboard:read",
  ],
};

/** Check if a role has a specific permission */
export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Check if a role has ANY of the given permissions */
export function hasAnyPermission(role: WorkspaceRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** Get all permissions for a role */
export function getPermissions(role: WorkspaceRole): Permission[] {
  return PERMISSIONS[role] ?? [];
}

/** Sidebar nav visibility rules */
export function canSeeNavItem(role: WorkspaceRole, item: string): boolean {
  switch (item) {
    case "finance":
      return hasPermission(role, "finance:read");
    case "team":
      return hasPermission(role, "team:read");
    default:
      return true;
  }
}
