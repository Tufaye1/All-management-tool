import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import type { WorkspaceRole, Client } from "@/lib/types";
import { InvoiceGeneratorForm } from "./invoice-generator-form";

export const metadata: Metadata = { title: "Create Invoice" };

export default async function InvoiceGeneratorPage() {
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

  if (!hasPermission(role, "finance:write")) {
    redirect("/dashboard/finance");
  }

  const workspaceId = membership.workspace_id;

  const [clientsResult, workspaceResult, invoiceCountResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, contact_name, contact_email")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("name"),
    supabase
      .from("workspaces")
      .select("id, name, currency")
      .eq("id", workspaceId)
      .single(),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
  ]);

  const clients = (clientsResult.data as Pick<Client, "id" | "name" | "contact_name" | "contact_email">[]) ?? [];
  const workspaceName = workspaceResult.data?.name ?? "Your Agency";
  const workspaceCurrency = (workspaceResult.data?.currency as string) ?? "USD";
  const invoiceCount = invoiceCountResult.count ?? 0;
  const nextInvoiceNumber = `INV-${String(invoiceCount + 1).padStart(3, "0")}`;

  return (
    <InvoiceGeneratorForm
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      clients={clients}
      nextInvoiceNumber={nextInvoiceNumber}
      defaultCurrency={workspaceCurrency}
    />
  );
}
