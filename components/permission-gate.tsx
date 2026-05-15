"use client";

import type { ReactNode } from "react";
import type { WorkspaceRole } from "@/lib/types";
import type { Permission } from "@/lib/permissions";
import { hasPermission, hasAnyPermission } from "@/lib/permissions";

type PermissionGateProps = {
  /** User's current role */
  role: WorkspaceRole;
  /** Required permission — show children if role has this */
  permission?: Permission;
  /** Alternative: show children if role has ANY of these */
  anyOf?: Permission[];
  /** Alternative: show children if role matches any of these roles */
  roles?: WorkspaceRole[];
  children: ReactNode;
  /** Optional fallback when access denied */
  fallback?: ReactNode;
};

export function PermissionGate({ role, permission, anyOf, roles, children, fallback = null }: PermissionGateProps) {
  let hasAccess = false;

  if (roles) {
    hasAccess = roles.includes(role);
  } else if (anyOf) {
    hasAccess = hasAnyPermission(role, anyOf);
  } else if (permission) {
    hasAccess = hasPermission(role, permission);
  }

  if (!hasAccess) return <>{fallback}</>;
  return <>{children}</>;
}
