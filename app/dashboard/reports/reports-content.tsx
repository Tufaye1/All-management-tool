"use client";

import { useState, useMemo } from "react";
import { Download, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/components/toast";
import styles from "./reports.module.css";

type RevenueRow = {
  id: string;
  client_id: string;
  amount: number;
  description: string | null;
  date: string;
  clients: { name: string }[] | null;
};

type CostRow = {
  id: string;
  client_id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  clients: { name: string }[] | null;
};

type InvoiceRow = {
  id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date: string | null;
  clients: { name: string }[] | null;
};

type ClientRow = { id: string; name: string };

type ReportsContentProps = {
  revenue: RevenueRow[];
  costs: CostRow[];
  invoices: InvoiceRow[];
  clients: ClientRow[];
  currency: string;
};

type ReportPeriod = "this_month" | "last_month" | "this_quarter" | "this_year" | "all_time";

const PERIODS: { key: ReportPeriod; label: string }[] = [
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_quarter", label: "This Quarter" },
  { key: "this_year", label: "This Year" },
  { key: "all_time", label: "All Time" },
];

function getDateRange(period: ReportPeriod): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  switch (period) {
    case "this_month":
      return {
        start: new Date(y, m, 1).toISOString().split("T")[0],
        end: new Date(y, m + 1, 0).toISOString().split("T")[0],
      };
    case "last_month":
      return {
        start: new Date(y, m - 1, 1).toISOString().split("T")[0],
        end: new Date(y, m, 0).toISOString().split("T")[0],
      };
    case "this_quarter": {
      const qStart = Math.floor(m / 3) * 3;
      return {
        start: new Date(y, qStart, 1).toISOString().split("T")[0],
        end: new Date(y, qStart + 3, 0).toISOString().split("T")[0],
      };
    }
    case "this_year":
      return {
        start: new Date(y, 0, 1).toISOString().split("T")[0],
        end: new Date(y, 11, 31).toISOString().split("T")[0],
      };
    case "all_time":
      return { start: "2000-01-01", end: "2099-12-31" };
  }
}

function inRange(date: string, start: string, end: string) {
  return date >= start && date <= end;
}

function clientName(row: { clients: { name: string }[] | null }) {
  return row.clients?.[0]?.name ?? "Unknown";
}

export function ReportsContent({ revenue, costs, invoices, clients, currency }: ReportsContentProps) {
  const { toast } = useToast();
  const [period, setPeriod] = useState<ReportPeriod>("this_month");
  const { start, end } = getDateRange(period);

  const filteredRevenue = useMemo(() => revenue.filter((r) => inRange(r.date, start, end)), [revenue, start, end]);
  const filteredCosts = useMemo(() => costs.filter((c) => inRange(c.date, start, end)), [costs, start, end]);

  // Per-client P&L
  const clientPnL = useMemo(() => {
    const map = new Map<string, { name: string; revenue: number; costs: number }>();

    for (const c of clients) {
      map.set(c.id, { name: c.name, revenue: 0, costs: 0 });
    }

    for (const r of filteredRevenue) {
      const entry = map.get(r.client_id);
      if (entry) entry.revenue += r.amount;
    }
    for (const c of filteredCosts) {
      const entry = map.get(c.client_id);
      if (entry) entry.costs += c.amount;
    }

    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data, profit: data.revenue - data.costs }))
      .filter((c) => c.revenue > 0 || c.costs > 0)
      .sort((a, b) => b.profit - a.profit);
  }, [clients, filteredRevenue, filteredCosts]);

  const totalRevenue = filteredRevenue.reduce((s, r) => s + r.amount, 0);
  const totalCosts = filteredCosts.reduce((s, c) => s + c.amount, 0);
  const totalProfit = totalRevenue - totalCosts;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Invoice stats for the period
  const periodInvoices = invoices.filter((i) => inRange(i.due_date, start, end));
  const paidInvoices = periodInvoices.filter((i) => i.status === "paid");
  const unpaidInvoices = periodInvoices.filter((i) => i.status !== "paid");

  function downloadCSV(type: "pnl" | "revenue" | "costs" | "invoices") {
    let csv = "";
    let filename = "";

    if (type === "pnl") {
      csv = "Client,Revenue,Costs,Profit\n";
      for (const c of clientPnL) {
        csv += `"${c.name}",${c.revenue},${c.costs},${c.profit}\n`;
      }
      csv += `"TOTAL",${totalRevenue},${totalCosts},${totalProfit}\n`;
      filename = "pnl-report.csv";
    } else if (type === "revenue") {
      csv = "Date,Client,Amount,Description\n";
      for (const r of filteredRevenue) {
        csv += `${r.date},"${clientName(r)}",${r.amount},"${r.description ?? ""}"\n`;
      }
      filename = "revenue.csv";
    } else if (type === "costs") {
      csv = "Date,Client,Category,Amount,Description\n";
      for (const c of filteredCosts) {
        csv += `${c.date},"${clientName(c)}",${c.category},${c.amount},"${c.description ?? ""}"\n`;
      }
      filename = "costs.csv";
    } else {
      csv = "Invoice #,Client,Amount,Status,Due Date,Paid Date\n";
      for (const i of periodInvoices) {
        csv += `${i.invoice_number},"${clientName(i)}",${i.amount},${i.status},${i.due_date},${i.paid_date ?? ""}\n`;
      }
      filename = "invoices.csv";
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Downloaded ${filename}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reports</h1>
      </div>

      {/* Period selector */}
      <div className={styles.tabs}>
        {PERIODS.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.tab} ${period === key ? styles.tabActive : ""}`}
            onClick={() => setPeriod(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Revenue</span>
          <span className={`${styles.statValue} ${styles.statPrimary}`}>{formatCurrency(totalRevenue, currency)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Total Costs</span>
          <span className={styles.statValue}>{formatCurrency(totalCosts, currency)}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Net Profit</span>
          <span className={`${styles.statValue} ${totalProfit >= 0 ? styles.statSuccess : styles.statDanger}`}>
            {formatCurrency(totalProfit, currency)}
          </span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Profit Margin</span>
          <span className={`${styles.statValue} ${profitMargin >= 0 ? styles.statSuccess : styles.statDanger}`}>
            {profitMargin.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* P&L by client */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>P&L by Client</h2>
          <button className={styles.exportBtn} onClick={() => downloadCSV("pnl")}>
            <Download size={14} />
            Export CSV
          </button>
        </div>

        {clientPnL.length === 0 ? (
          <p className={styles.empty}>No financial data for this period.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th className={styles.right}>Revenue</th>
                  <th className={styles.right}>Costs</th>
                  <th className={styles.right}>Profit</th>
                </tr>
              </thead>
              <tbody>
                {clientPnL.map((c) => (
                  <tr key={c.id}>
                    <td className={styles.cellName}>{c.name}</td>
                    <td className={styles.right}>{formatCurrency(c.revenue, currency)}</td>
                    <td className={styles.right}>{formatCurrency(c.costs, currency)}</td>
                    <td className={`${styles.right} ${c.profit >= 0 ? styles.cellPositive : styles.cellNegative}`}>
                      {formatCurrency(c.profit, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className={styles.cellName}>Total</td>
                  <td className={styles.right}>{formatCurrency(totalRevenue, currency)}</td>
                  <td className={styles.right}>{formatCurrency(totalCosts, currency)}</td>
                  <td className={`${styles.right} ${totalProfit >= 0 ? styles.cellPositive : styles.cellNegative}`}>
                    {formatCurrency(totalProfit, currency)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Invoice summary */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Invoices</h2>
          <button className={styles.exportBtn} onClick={() => downloadCSV("invoices")}>
            <Download size={14} />
            Export CSV
          </button>
        </div>

        <div className={styles.invoiceStats}>
          <div className={styles.invoiceStat}>
            <span className={styles.invoiceStatValue}>{periodInvoices.length}</span>
            <span className={styles.invoiceStatLabel}>Total</span>
          </div>
          <div className={styles.invoiceStat}>
            <span className={`${styles.invoiceStatValue} ${styles.statSuccess}`}>{paidInvoices.length}</span>
            <span className={styles.invoiceStatLabel}>Paid</span>
          </div>
          <div className={styles.invoiceStat}>
            <span className={`${styles.invoiceStatValue} ${unpaidInvoices.length > 0 ? styles.statDanger : ""}`}>
              {unpaidInvoices.length}
            </span>
            <span className={styles.invoiceStatLabel}>Unpaid</span>
          </div>
          <div className={styles.invoiceStat}>
            <span className={styles.invoiceStatValue}>
              {formatCurrency(paidInvoices.reduce((s, i) => s + i.amount, 0), currency)}
            </span>
            <span className={styles.invoiceStatLabel}>Collected</span>
          </div>
        </div>
      </div>

      {/* Export all */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Export Data</h2>
        </div>
        <div className={styles.exportGrid}>
          <button className={styles.exportCard} onClick={() => downloadCSV("revenue")}>
            <FileText size={20} />
            <span className={styles.exportCardLabel}>Revenue ({filteredRevenue.length} entries)</span>
            <Download size={14} />
          </button>
          <button className={styles.exportCard} onClick={() => downloadCSV("costs")}>
            <FileText size={20} />
            <span className={styles.exportCardLabel}>Costs ({filteredCosts.length} entries)</span>
            <Download size={14} />
          </button>
          <button className={styles.exportCard} onClick={() => downloadCSV("invoices")}>
            <FileText size={20} />
            <span className={styles.exportCardLabel}>Invoices ({periodInvoices.length})</span>
            <Download size={14} />
          </button>
          <button className={styles.exportCard} onClick={() => downloadCSV("pnl")}>
            <FileText size={20} />
            <span className={styles.exportCardLabel}>P&L Report</span>
            <Download size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
