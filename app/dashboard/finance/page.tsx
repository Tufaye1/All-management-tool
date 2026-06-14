import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFinancePermissions } from "@/lib/permissions";
import type { WorkspaceRole, Client, RevenueEntry, CostEntry, InvoiceWithClient } from "@/lib/types";
import { FinanceDashboard } from "./finance-dashboard";

export const metadata: Metadata = { title: "Finance" };

export default async function FinancePage() {
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
  const permissions = getFinancePermissions(role);

  // Sales (and anyone else without finance access) get bounced.
  if (!permissions.canViewDashboard && !permissions.canViewList) {
    redirect("/dashboard");
  }

  const workspaceId = membership.workspace_id;

  const [revenueResult, costsResult, invoicesResult, clientsResult, workspaceResult] = await Promise.all([
    supabase
      .from("revenue_entries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: false }),
    supabase
      .from("cost_entries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("date", { ascending: false }),
    supabase
      .from("invoices")
      .select("*, clients(name)")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("name"),
    supabase
      .from("workspaces")
      .select("currency")
      .eq("id", workspaceId)
      .single(),
  ]);

  const revenue = (revenueResult.data as RevenueEntry[]) ?? [];
  const costs = (costsResult.data as CostEntry[]) ?? [];
  const invoices = (invoicesResult.data as InvoiceWithClient[]) ?? [];
  const clients = (clientsResult.data as Pick<Client, "id" | "name">[]) ?? [];
  const currency = (workspaceResult.data?.currency as string) ?? "USD";

  return (
    <FinanceDashboard
      workspaceId={workspaceId}
      permissions={permissions}
      revenue={revenue}
      costs={costs}
      invoices={invoices}
      clients={clients}
      currency={currency}
    />
  );
}
