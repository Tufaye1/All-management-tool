import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client, Project, WorkspaceRole } from "@/lib/types";
import { hasPermission } from "@/lib/permissions";
import { ClientDetail } from "./client-detail";

type PageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function ClientDetailPage({ params }: PageProps) {
  const { clientId } = await params;
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

  const workspaceId = membership.workspace_id;

  const [clientResult, projectsResult, integrationsResult, templatesResult] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .eq("workspace_id", workspaceId)
      .single(),
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", clientId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("workspace_integrations")
      .select("provider")
      .eq("workspace_id", workspaceId),
    supabase
      .from("project_templates")
      .select("id, name, template_tasks(id)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
  ]);

  if (!clientResult.data) {
    notFound();
  }

  const role = membership.role as WorkspaceRole;
  const canEdit = hasPermission(role, "projects:write");

  const connectedProviders = (integrationsResult.data ?? []).map((i) => i.provider);
  const driveConnected = connectedProviders.includes("google_drive");
  const slackConnected = connectedProviders.includes("slack");

  const templates = (templatesResult.data ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    taskCount: Array.isArray(t.template_tasks) ? t.template_tasks.length : 0,
  }));

  return (
    <ClientDetail
      client={clientResult.data as Client}
      projects={(projectsResult.data as Project[]) ?? []}
      workspaceId={workspaceId}
      canEdit={canEdit}
      templates={templates}
      driveConnected={driveConnected}
      slackConnected={slackConnected}
    />
  );
}
