"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkspaceRole, WorkspaceMemberStatus } from "@/lib/types";
import {
  hasPermission,
  hasAnyPermission,
  getFinancePermissions,
  type Permission,
  type FinancePermissions,
} from "@/lib/permissions";

type PermissionsState = {
  role: WorkspaceRole | null;
  status: WorkspaceMemberStatus | null;
  isLoading: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
};

export function usePermissions(): PermissionsState {
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [status, setStatus] = useState<WorkspaceMemberStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from("workspace_members")
        .select("role, status")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (data) {
        setRole(data.role as WorkspaceRole);
        setStatus(data.status as WorkspaceMemberStatus);
      }
      setIsLoading(false);
    }

    loadRole();
  }, []);

  return {
    role,
    status,
    isLoading,
    can: (permission: Permission) => role ? hasPermission(role, permission) : false,
    canAny: (permissions: Permission[]) => role ? hasAnyPermission(role, permissions) : false,
  };
}

/**
 * Returns the finance UI gates for the current user's role.
 * Falls back to all-false while the role is still loading or unset.
 */
export function useFinancePermissions(): FinancePermissions & { isLoading: boolean } {
  const { role, isLoading } = usePermissions();

  if (!role) {
    return {
      canViewDashboard: false,
      canViewList: false,
      canCreateInvoice: false,
      canCreateExpense: false,
      isLoading,
    };
  }

  return { ...getFinancePermissions(role), isLoading };
}
