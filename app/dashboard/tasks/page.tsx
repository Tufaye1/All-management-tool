import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client, TaskWithRelations, WorkspaceMemberWithEmail, WorkspaceRole, Profile } from "@/lib/types";
import { hasPermission } from "@/lib/permissions";
import { TaskList } from "./task-list";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
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

  const [tasksResult, clientsResult, membersResult, profilesResult] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, projects(name), clients(name)")
      .eq("workspace_id", membership.workspace_id)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("*")
      .eq("workspace_id", membership.workspace_id)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", membership.workspace_id),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url"),
  ]);

  const tasks = (tasksResult.data as TaskWithRelations[]) ?? [];
  const clients = (clientsResult.data as Client[]) ?? [];
  const profiles = (profilesResult.data ?? []) as Profile[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const membersWithEmail: WorkspaceMemberWithEmail[] = (membersResult.data ?? []).map((m) => {
    const profile = profileMap.get(m.user_id);
    const isSelf = m.user_id === user.id;
    return {
      ...m,
      email: isSelf ? (user.email ?? m.user_id) : (profile?.full_name ?? m.user_id.slice(0, 8)),
      full_name: profile?.full_name ?? (isSelf ? (user.user_metadata?.full_name as string ?? null) : null),
    };
  });

  const role = membership.role as WorkspaceRole;
  const canEdit = hasPermission(role, "tasks:write_own");

  return (
    <TaskList
      tasks={tasks}
      clients={clients}
      members={membersWithEmail}
      workspaceId={membership.workspace_id}
      userId={user.id}
      canEdit={canEdit}
    />
  );
}
