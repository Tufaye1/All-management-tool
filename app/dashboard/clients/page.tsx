import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";
import { ClientList } from "./client-list";

export default async function ClientsPage() {
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

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("workspace_id", membership.workspace_id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  const canEdit = ["admin", "account_lead"].includes(membership.role);

  return (
    <div style={{
      background: "var(--color-bg-app)",
      minHeight: "100vh",
      padding: "var(--space-8) var(--space-5)",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <ClientList
          clients={(clients as Client[]) ?? []}
          workspaceId={membership.workspace_id}
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
