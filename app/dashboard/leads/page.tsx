import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import type { WorkspaceRole, Lead, WorkspaceMemberWithEmail, Profile } from "@/lib/types";
import { LeadsBoard } from "./leads-board";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage() {
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

  if (!hasPermission(role, "leads:read")) {
    redirect("/dashboard");
  }

  const canWrite = hasPermission(role, "leads:write");
  const workspaceId = membership.workspace_id;

  const [leadsResult, membersResult, profilesResult, workspaceResult] = await Promise.all([
    supabase
      .from("leads")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url"),
    supabase
      .from("workspaces")
      .select("currency")
      .eq("id", workspaceId)
      .single(),
  ]);

  const leads = (leadsResult.data as Lead[]) ?? [];
  const profiles = (profilesResult.data ?? []) as Profile[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const members: WorkspaceMemberWithEmail[] = (membersResult.data ?? []).map((m) => {
    const profile = profileMap.get(m.user_id);
    const isSelf = m.user_id === user.id;
    return {
      ...m,
      email: isSelf ? (user.email ?? m.user_id) : (profile?.full_name ?? m.user_id.slice(0, 8)),
      full_name: profile?.full_name ?? (isSelf ? (user.user_metadata?.full_name as string ?? null) : null),
    };
  });

  const currency = (workspaceResult.data?.currency as string) ?? "USD";

  return (
    <LeadsBoard
      leads={leads}
      members={members}
      workspaceId={workspaceId}
      canWrite={canWrite}
      currency={currency}
    />
  );
}
