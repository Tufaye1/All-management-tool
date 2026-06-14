import type { WorkspaceRole } from "./types";

/**
 * Single source of truth for role-based access.
 *
 * Three roles:
 *   admin       — full control over everything
 *   team_member — operates on clients/projects/tasks; can create invoices/expenses
 *                 and see the finance list, but no finance dashboard. Creates leads
 *                 only — cannot edit, move pipeline, or convert.
 *   sales       — leads + their own tasks only. Personal dashboard view.
 */
export type Permission =
  // Clients
  | "clients:read"
  | "clients:create"
  | "clients:edit"
  | "clients:delete"
  // Projects
  | "projects:read"
  | "projects:create"
  | "projects:edit"
  | "projects:delete"
  // Tasks
  | "tasks:read"
  | "tasks:create"
  | "tasks:edit_own"
  | "tasks:edit_all"
  | "tasks:assign_others"
  | "tasks:delete"
  // Leads
  | "leads:read"
  | "leads:create"
  | "leads:edit"
  | "leads:delete"
  | "leads:move_pipeline"
  | "leads:convert"
  // Finance
  | "finance:view_dashboard"   // summary widgets, P&L, charts (admin only)
  | "finance:view_list"        // flat list of invoices + expenses with amounts
  | "finance:create_invoice"
  | "finance:create_expense"
  | "finance:edit"
  | "finance:delete"
  // Team
  | "team:view"
  | "team:invite"
  | "team:manage"              // change role, suspend, delete members
  // Dashboard
  | "dashboard:view_main"      // admin/team_member: agency-wide stats
  | "dashboard:view_personal"  // sales: their pipeline + their tasks only
  // Reports
  | "reports:view";

const ADMIN_PERMISSIONS: Permission[] = [
  "clients:read", "clients:create", "clients:edit", "clients:delete",
  "projects:read", "projects:create", "projects:edit", "projects:delete",
  "tasks:read", "tasks:create", "tasks:edit_own", "tasks:edit_all", "tasks:assign_others", "tasks:delete",
  "leads:read", "leads:create", "leads:edit", "leads:delete", "leads:move_pipeline", "leads:convert",
  "finance:view_dashboard", "finance:view_list", "finance:create_invoice", "finance:create_expense", "finance:edit", "finance:delete",
  "team:view", "team:invite", "team:manage",
  "dashboard:view_main",
  "reports:view",
];

const TEAM_MEMBER_PERMISSIONS: Permission[] = [
  "clients:read", "clients:create", "clients:edit",
  "projects:read", "projects:create", "projects:edit",
  "tasks:read", "tasks:create", "tasks:edit_own", "tasks:assign_others",
  "leads:read", "leads:create",
  "finance:view_list", "finance:create_invoice", "finance:create_expense",
  "team:view",
  "dashboard:view_main",
];

const SALES_PERMISSIONS: Permission[] = [
  "tasks:read", "tasks:edit_own",
  "leads:read", "leads:create", "leads:edit", "leads:delete", "leads:move_pipeline", "leads:convert",
  "dashboard:view_personal",
];

const PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  admin: ADMIN_PERMISSIONS,
  team_member: TEAM_MEMBER_PERMISSIONS,
  sales: SALES_PERMISSIONS,
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

/** Sidebar nav visibility per role. */
export function canSeeNavItem(role: WorkspaceRole, item: string): boolean {
  switch (item) {
    case "dashboard":
      return hasAnyPermission(role, ["dashboard:view_main", "dashboard:view_personal"]);
    case "clients":
      return hasPermission(role, "clients:read");
    case "tasks":
      return hasPermission(role, "tasks:read");
    case "leads":
      return hasPermission(role, "leads:read");
    case "finance":
      return hasAnyPermission(role, ["finance:view_dashboard", "finance:view_list"]);
    case "reports":
      return hasPermission(role, "reports:view");
    case "team":
      return hasPermission(role, "team:view");
    case "settings":
      return true;
    default:
      return false;
  }
}

/**
 * Finance UI gating. The Finance page renders differently per role:
 *   - admin       sees summary widgets + P&L + charts + full list
 *   - team_member sees only the flat invoice/expense list and the create buttons
 *   - sales       no access (nav item is hidden)
 */
export type FinancePermissions = {
  canViewDashboard: boolean;
  canViewList: boolean;
  canCreateInvoice: boolean;
  canCreateExpense: boolean;
};

export function getFinancePermissions(role: WorkspaceRole): FinancePermissions {
  return {
    canViewDashboard: hasPermission(role, "finance:view_dashboard"),
    canViewList: hasPermission(role, "finance:view_list"),
    canCreateInvoice: hasPermission(role, "finance:create_invoice"),
    canCreateExpense: hasPermission(role, "finance:create_expense"),
  };
}
