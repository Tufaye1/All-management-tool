import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceMemberWithEmail, Invitation, WorkspaceRole, Profile } from "@/lib/types";
import { hasPermission } from "@/lib/permissions";
import { TeamList } from "./team-list";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
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
    redirect("/login");
  }

  const wid = membership.workspace_id;
  const role = membership.role as WorkspaceRole;
  const canManageTeam = hasPermission(role, "team:manage");
  const canInvite = hasPermission(role, "team:invite");

  const [membersResult, profilesResult] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url"),
  ]);

  const rawMembers = membersResult.data ?? [];
  const profiles = (profilesResult.data ?? []) as Profile[];
  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const members: WorkspaceMemberWithEmail[] = rawMembers.map((m) => {
    const profile = profileMap.get(m.user_id);
    const isSelf = m.user_id === user.id;
    return {
      ...m,
      email: isSelf ? (user.email ?? "unknown") : (profile?.full_name ?? m.user_id.slice(0, 8)),
      full_name: profile?.full_name ?? (isSelf ? (user.user_metadata?.full_name as string | null) : null),
    };
  });

  let invitations: Invitation[] = [];
  if (canInvite) {
    const { data } = await supabase
      .from("invitations")
      .select("*")
      .eq("workspace_id", wid)
      .is("accepted_at", null)
      .order("created_at", { ascending: false });

    invitations = (data as Invitation[]) ?? [];
  }

  return (
    <TeamList
      members={members}
      invitations={invitations}
      workspaceId={wid}
      currentUserId={user.id}
      canInvite={canInvite}
      canManageTeam={canManageTeam}
    />
  );
}
