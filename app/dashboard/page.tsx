import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getOrCreateWorkspace(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, email: string) {
  const { data: membership, error: memberError } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (memberError) {
    console.error("workspace_members query failed:", memberError.message, memberError.code);
  }

  if (membership) {
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("id", membership.workspace_id)
      .single();

    if (wsError) {
      console.error("workspaces query failed:", wsError.message, wsError.code);
    }

    if (workspace) {
      return workspace;
    }
  }

  const { data: authUser } = await supabase.auth.getUser();
  const fullName = authUser.user?.user_metadata?.full_name;
  const workspaceName = (fullName || email.split("@")[0]) + "'s Workspace";

  const { data: newWorkspace, error: createError } = await supabase
    .from("workspaces")
    .insert({ name: workspaceName, owner_id: userId })
    .select()
    .single();

  if (createError) {
    console.error("workspace create failed:", createError.message, createError.code);
    return null;
  }

  const { error: addMemberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: newWorkspace.id, user_id: userId, role: "admin" });

  if (addMemberError) {
    console.error("workspace_members insert failed:", addMemberError.message, addMemberError.code);
  }

  return newWorkspace;
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
