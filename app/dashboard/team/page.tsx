import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceMemberWithEmail, Invitation } from "@/lib/types";
import { TeamList } from "./team-list";

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
  const isAdmin = membership.role === "admin";

  const { data: rawMembers } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", wid)
    .order("created_at", { ascending: true });

  const members: WorkspaceMemberWithEmail[] = (rawMembers ?? []).map((m) => {
    const isSelf = m.user_id === user.id;
    return {
      ...m,
      email: isSelf ? (user.email ?? "unknown") : `${m.user_id.slice(0, 8)}@member`,
      full_name: isSelf ? (user.user_metadata?.full_name as string | null) : null,
    };
  });

  let invitations: Invitation[] = [];
  if (isAdmin) {
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
      isAdmin={isAdmin}
    />
  );
}
