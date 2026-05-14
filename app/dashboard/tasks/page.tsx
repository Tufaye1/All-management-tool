import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client, TaskWithRelations, WorkspaceMemberWithEmail } from "@/lib/types";
import { TaskList } from "./task-list";

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

  const [tasksResult, clientsResult, membersResult] = await Promise.all([
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
  ]);

  const tasks = (tasksResult.data as TaskWithRelations[]) ?? [];
  const clients = (clientsResult.data as Client[]) ?? [];

  const membersWithEmail: WorkspaceMemberWithEmail[] = (membersResult.data ?? []).map((m) => ({
    ...m,
    email: m.user_id === user.id ? (user.email ?? m.user_id) : m.user_id,
    full_name: m.user_id === user.id ? (user.user_metadata?.full_name as string ?? null) : null,
  }));

  const canEdit = ["admin", "account_lead", "team_member"].includes(membership.role);

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
