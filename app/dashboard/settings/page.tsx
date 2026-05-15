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

  const [membershipResult, profileResult] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .single(),
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
  ]);

  if (!membershipResult.data) {
    redirect("/dashboard");
  }

  const role = membershipResult.data.role as WorkspaceRole;
  const workspaceId = membershipResult.data.workspace_id;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name, currency, owner_id")
    .eq("id", workspaceId)
    .single();

  return (
    <SettingsForm
      workspaceId={workspace?.id ?? workspaceId}
      workspaceName={workspace?.name ?? ""}
      currency={workspace?.currency ?? "USD"}
      ownerId={workspace?.owner_id ?? ""}
      role={role}
      userId={user.id}
      userEmail={user.email ?? ""}
      fullName={profileResult.data?.full_name ?? ""}
      avatarUrl={profileResult.data?.avatar_url ?? ""}
    />
  );
}
