import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getOrCreateWorkspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, email: string) {
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(id, name)")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (membership?.workspaces) {
    return membership.workspaces;
  }

  const { data: user } = await supabase.auth.getUser();
  const fullName = user.user?.user_metadata?.full_name;
  const workspaceName = (fullName || email.split("@")[0]) + "'s Workspace";

  const { data: workspace, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: workspaceName, owner_id: userId })
    .select()
    .single();

  if (wsError || !workspace) {
    return null;
  }

  await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspace.id, user_id: userId, role: "admin" });

  return workspace;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workspace = await getOrCreateWorkspace(supabase, user.id, user.email ?? "");

  return (
    <div style={{
      background: "var(--color-bg-app)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-5)",
    }}>
      <div className="card-elevated" style={{
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
      }}>
        <h2>Welcome to Agency OS</h2>
        {workspace ? (
          <p style={{
            color: "var(--color-text-secondary)",
            fontSize: "var(--text-base)",
            margin: 0,
          }}>
            {workspace.name}
          </p>
        ) : (
          <p style={{
            color: "var(--color-danger)",
            fontSize: "var(--text-base)",
            margin: 0,
          }}>
            Could not load workspace. Contact your admin.
          </p>
        )}
        <p style={{
          color: "var(--color-text-tertiary)",
          fontSize: "var(--text-sm)",
          margin: 0,
        }}>
          {user.email}
        </p>
      </div>
    </div>
  );
}
