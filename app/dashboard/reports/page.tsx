import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import type { WorkspaceRole } from "@/lib/types";
import { ReportsContent } from "./reports-content";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
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
  if (!hasPermission(role, "finance:read")) {
    redirect("/dashboard");
  }

  const wid = membership.workspace_id;

  const [revenueResult, costsResult, invoicesResult, clientsResult, workspaceResult] = await Promise.all([
    supabase
      .from("revenue_entries")
      .select("id, client_id, amount, description, date, clients(name)")
      .eq("workspace_id", wid)
      .order("date", { ascending: false }),
    supabase
      .from("cost_entries")
      .select("id, client_id, amount, category, description, date, clients(name)")
      .eq("workspace_id", wid)
      .order("date", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, client_id, invoice_number, amount, status, due_date, paid_date, clients(name)")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name")
      .eq("workspace_id", wid)
      .is("archived_at", null)
      .order("name"),
    supabase
      .from("workspaces")
      .select("currency")
      .eq("id", wid)
      .single(),
  ]);

  return (
    <ReportsContent
      revenue={revenueResult.data ?? []}
      costs={costsResult.data ?? []}
      invoices={invoicesResult.data ?? []}
      clients={clientsResult.data ?? []}
      currency={workspaceResult.data?.currency ?? "USD"}
    />
  );
}
