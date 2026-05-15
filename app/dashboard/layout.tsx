import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole } from "@/lib/types";
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
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .single(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
  ]);

  const role: WorkspaceRole = (membershipResult.data?.role as WorkspaceRole) ?? "viewer";
  const fullName = profileResult.data?.full_name ?? null;

  return (
    <ToastProvider>
      <div style={{ background: "var(--color-bg-app)", minHeight: "100vh" }}>
        <DashboardNav email={user.email ?? ""} role={role} fullName={fullName} />
        <main className={styles.main}>
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
