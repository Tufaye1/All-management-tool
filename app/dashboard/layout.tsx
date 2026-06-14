import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole, WorkspaceMemberStatus } from "@/lib/types";
import { DashboardNav } from "./dashboard-nav";
import { ToastProvider } from "@/components/toast";
import styles from "./nav.module.css";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [membershipResult, profileResult] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("workspace_id, role, status")
      .eq("user_id", user.id)
      .limit(1)
      .single(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
  ]);

  const memberStatus = (membershipResult.data?.status as WorkspaceMemberStatus | undefined) ?? "active";
  if (memberStatus === "suspended") {
    redirect("/suspended");
  }

  const role: WorkspaceRole = (membershipResult.data?.role as WorkspaceRole) ?? "team_member";
  const fullName = profileResult.data?.full_name ?? null;
  const workspaceId = membershipResult.data?.workspace_id ?? "";

  return (
    <ToastProvider>
      <div style={{ background: "var(--color-bg-app)", minHeight: "100vh" }}>
        <DashboardNav
          email={user.email ?? ""}
          role={role}
          fullName={fullName}
          userId={user.id}
          workspaceId={workspaceId}
        />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
