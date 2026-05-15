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

  const [workspaceResult, integrationsResult, templatesResult] = await Promise.all([
    supabase
      .from("workspaces")
      .select("id, name, currency, owner_id")
      .eq("id", workspaceId)
      .single(),
    supabase
      .from("workspace_integrations")
      .select("provider, extra_data")
      .eq("workspace_id", workspaceId),
    supabase
      .from("project_templates")
      .select("id, name, description, created_at, template_tasks(id)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  const workspace = workspaceResult.data;
  const integrations = integrationsResult.data ?? [];

  const connectedProviders = integrations.map((i) => i.provider);
  const slackTeamName = integrations.find((i) => i.provider === "slack")
    ?.extra_data as Record<string, unknown> | null;

  const templates = (templatesResult.data ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    description: t.description as string | null,
    taskCount: Array.isArray(t.template_tasks) ? t.template_tasks.length : 0,
    createdAt: t.created_at as string,
  }));

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
      connectedProviders={connectedProviders}
      slackTeamName={(slackTeamName?.team_name as string) ?? null}
      templates={templates}
    />
  );
}
