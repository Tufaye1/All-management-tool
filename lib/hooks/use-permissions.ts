"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { WorkspaceRole } from "@/lib/types";
import { hasPermission, hasAnyPermission, type Permission } from "@/lib/permissions";

type PermissionsState = {
  role: WorkspaceRole | null;
  isLoading: boolean;
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
};

export function usePermissions(): PermissionsState {
  const [role, setRole] = useState<WorkspaceRole | null>(null);
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
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (data) {
        setRole(data.role as WorkspaceRole);
      }
      setIsLoading(false);
    }

    loadRole();
  }, []);

  return {
    role,
    isLoading,
    can: (permission: Permission) => role ? hasPermission(role, permission) : false,
    canAny: (permissions: Permission[]) => role ? hasAnyPermission(role, permissions) : false,
  };
}
