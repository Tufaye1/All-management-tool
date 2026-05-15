"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Plus, Download, FileText } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { formatCurrency } from "@/lib/currency";
import type { RevenueEntry, CostEntry, InvoiceWithClient, Client } from "@/lib/types";
import { RevenueModal } from "./revenue-modal";
import { CostModal } from "./cost-modal";
import { InvoicePdf } from "./invoice-pdf";
import styles from "./finance.module.css";

type FinanceDashboardProps = {
  workspaceId: string;
  canWrite: boolean;
  revenue: RevenueEntry[];
  costs: CostEntry[];
  invoices: InvoiceWithClient[];
  clients: Pick<Client, "id" | "name">[];
  currency: string;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_PILL: Record<string, string> = {
  unpaid: "pill pill-warning",
  paid: "pill pill-success",
  overdue: "pill pill-danger",
};

const CATEGORY_LABELS: Record<string, string> = {
  ad_spend: "Ad Spend",
  freelancer: "Freelancer",
  tools: "Tools",
  other: "Other",
};

export function FinanceDashboard({
  workspaceId,
  canWrite,
  revenue,
  costs,
  invoices,
  clients,
  currency,
}: FinanceDashboardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [activeModal, setActiveModal] = useState<"revenue" | "cost" | null>(null);

  const totalRevenue = useMemo(() => revenue.reduce((sum, r) => sum + r.amount, 0), [revenue]);
  const totalCosts = useMemo(() => costs.reduce((sum, c) => sum + c.amount, 0), [costs]);
  const netProfit = totalRevenue - totalCosts;
  const outstanding = useMemo(
    () => invoices.filter((i) => i.status === "unpaid" || i.status === "overdue").reduce((sum, i) => sum + i.amount, 0),
    [invoices],
  );

  /* Per-client P&L */
  const clientPnL = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; costs: number }>();

    for (const r of revenue) {
      const clientName = clients.find((c) => c.id === r.client_id)?.name ?? "Unknown";
      const entry = map.get(r.client_id) ?? { name: clientName, revenue: 0, costs: 0 };
      entry.revenue += r.amount;
      map.set(r.client_id, entry);
    }

    for (const c of costs) {
      const clientName = clients.find((cl) => cl.id === c.client_id)?.name ?? "Unknown";
      const entry = map.get(c.client_id) ?? { name: clientName, revenue: 0, costs: 0 };
      entry.costs += c.amount;
      map.set(c.client_id, entry);
    }

    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data, profit: data.revenue - data.costs }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [revenue, costs, clients]);

  /* Recent transactions (last 10 combined) */
  const recentTransactions = useMemo(() => {
    const items: { id: string; type: "revenue" | "cost"; amount: number; description: string; clientName: string; date: string }[] = [];

    for (const r of revenue) {
      items.push({
        id: r.id,
        type: "revenue",
        amount: r.amount,
        description: r.description ?? "Revenue",
        clientName: clients.find((c) => c.id === r.client_id)?.name ?? "Unknown",
        date: r.date,
      });
    }

    for (const c of costs) {
      items.push({
        id: c.id,
        type: "cost",
        amount: c.amount,
        description: c.description ?? CATEGORY_LABELS[c.category] ?? "Cost",
        clientName: clients.find((cl) => cl.id === c.client_id)?.name ?? "Unknown",
        date: c.date,
      });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [revenue, costs, clients]);

  async function handleDownloadPdf(inv: InvoiceWithClient) {
    const blob = await pdf(
      <InvoicePdf
        invoiceNumber={inv.invoice_number}
        clientName={inv.clients?.name ?? "Client"}
        amount={inv.amount}
        issuedDate={inv.created_at}
        dueDate={inv.due_date}
        notes={inv.notes}
        currencyCode={currency}
      />,
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${inv.invoice_number}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleMarkPaid(invoiceId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("invoices")
      .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
      .eq("id", invoiceId);

    if (error) {
      toast("Failed to update invoice");
      return;
    }
    toast("Invoice marked as paid");
    router.refresh();
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Finance</h1>
        {canWrite && (
          <div className={styles.actions}>
            <button className="primary" onClick={() => setActiveModal("revenue")}>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Plus size={16} /> Revenue
              </span>
            </button>
            <button className="secondary" onClick={() => setActiveModal("cost")}>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Plus size={16} /> Cost
              </span>
            </button>
            <Link href="/dashboard/finance/invoice-generator" style={{ textDecoration: "none" }}>
              <button className="secondary" type="button">
                <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <FileText size={16} /> Create Invoice
                </span>
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <TrendingUp size={14} style={{ verticalAlign: "middle", marginRight: "var(--space-1)" }} />
            Total Revenue
          </span>
          <span className={styles.statValue}>{formatCurrency(totalRevenue, currency)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <TrendingDown size={14} style={{ verticalAlign: "middle", marginRight: "var(--space-1)" }} />
            Total Costs
          </span>
          <span className={styles.statValue}>{formatCurrency(totalCosts, currency)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <DollarSign size={14} style={{ verticalAlign: "middle", marginRight: "var(--space-1)" }} />
            Net Profit
          </span>
          <span className={netProfit >= 0 ? styles.statValueGreen : styles.statValueRed}>
            {formatCurrency(netProfit, currency)}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: "var(--space-1)" }} />
            Outstanding
          </span>
          <span className={outstanding > 0 ? styles.statValueRed : styles.statValue}>
            {formatCurrency(outstanding, currency)}
          </span>
        </div>
      </div>

      {/* Per-Client P&L */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Client P&L</h2>
        </div>
        {clientPnL.length === 0 ? (
          <p className={styles.empty}>No revenue or cost entries yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Revenue</th>
                  <th>Costs</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {clientPnL.map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td className={styles.amountCell}>{formatCurrency(row.revenue, currency)}</td>
                    <td className={styles.amountCell}>{formatCurrency(row.costs, currency)}</td>
                    <td className={row.profit >= 0 ? styles.profitPositive : styles.profitNegative}>
                      {formatCurrency(row.profit, currency)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td style={{ fontWeight: "var(--weight-semibold)" }}>Total</td>
                  <td className={styles.amountCell} style={{ fontWeight: "var(--weight-semibold)" }}>
                    {formatCurrency(totalRevenue, currency)}
                  </td>
                  <td className={styles.amountCell} style={{ fontWeight: "var(--weight-semibold)" }}>
                    {formatCurrency(totalCosts, currency)}
                  </td>
                  <td className={netProfit >= 0 ? styles.profitPositive : styles.profitNegative}>
                    {formatCurrency(netProfit, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoices */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Invoices</h2>
        </div>
        {invoices.length === 0 ? (
          <p className={styles.empty}>No invoices yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontWeight: "var(--weight-medium)" }}>{inv.invoice_number}</td>
                    <td>{inv.clients?.name ?? "—"}</td>
                    <td className={styles.amountCell}>{formatCurrency(inv.amount, currency)}</td>
                    <td>
                      <span className={STATUS_PILL[inv.status] ?? "pill"}>
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                      {formatDate(inv.due_date)}
                    </td>
                    <td>
                      <div className={styles.invoiceActions}>
                        {canWrite && (inv.status === "unpaid" || inv.status === "overdue") && (
                          <button
                            className={styles.markPaidBtn}
                            onClick={() => handleMarkPaid(inv.id)}
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          className={styles.markPaidBtn}
                          style={{ background: "var(--color-info-light)", color: "var(--color-info)" }}
                          onClick={() => handleDownloadPdf(inv)}
                          title="Download PDF"
                        >
                          <Download size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Transactions</h2>
        </div>
        {recentTransactions.length === 0 ? (
          <p className={styles.empty}>No transactions yet.</p>
        ) : (
          <div className={styles.transactionList}>
            {recentTransactions.map((tx) => (
              <div key={tx.id} className={styles.transactionRow}>
                <div className={styles.transactionLeft}>
                  <span className={styles.transactionDesc}>{tx.description}</span>
                  <span className={styles.transactionMeta}>
                    {tx.clientName} &middot; {formatDate(tx.date)}
                  </span>
                </div>
                <span
                  className={`${styles.transactionAmount} ${tx.type === "revenue" ? styles.amountPositive : styles.amountNegative}`}
                >
                  {tx.type === "revenue" ? "+" : "−"}{formatCurrency(tx.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === "revenue" && (
        <RevenueModal
          workspaceId={workspaceId}
          clients={clients}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === "cost" && (
        <CostModal
          workspaceId={workspaceId}
          clients={clients}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
