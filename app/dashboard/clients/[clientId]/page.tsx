import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Client, Project } from "@/lib/types";
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

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("workspace_id", membership.workspace_id)
    .single();

  if (!client) {
    notFound();
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .eq("workspace_id", membership.workspace_id)
    .order("created_at", { ascending: false });

  const canEdit = ["admin", "account_lead"].includes(membership.role);

  return (
    <ClientDetail
      client={client as Client}
      projects={(projects as Project[]) ?? []}
      workspaceId={membership.workspace_id}
      canEdit={canEdit}
    />
  );
}
