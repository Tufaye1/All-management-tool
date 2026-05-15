import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceRole } from "@/lib/types";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) {
    redirect("/dashboard");
  }

  const role = membership.role as WorkspaceRole;

  if (role !== "admin") {
    redirect("/dashboard");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, currency")
    .eq("id", membership.workspace_id)
    .single();

  if (!workspace) {
    redirect("/dashboard");
  }

  return (
    <SettingsForm
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      currency={workspace.currency ?? "USD"}
    />
  );
}
