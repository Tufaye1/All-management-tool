import { Fragment } from "react";
import Link from "next/link";
import { Target, ListTodo } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/currency";
import styles from "./dashboard.module.css";

type SalesDashboardProps = {
  userId: string;
  workspaceId: string;
  displayName: string;
  currency: string;
};

const STAGE_ORDER = ["new", "contacted", "proposal", "negotiation", "won", "lost"] as const;
const STAGE_LABELS: Record<(typeof STAGE_ORDER)[number], string> = {
  new: "New",
  contacted: "Contacted",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getMonthStart() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export async function SalesDashboard({ userId, workspaceId, displayName, currency }: SalesDashboardProps) {
  const supabase = await createClient();
  const today = getToday();
  const monthStartStr = getMonthStart();

  const [myLeadsResult, myTasksResult, newMonthLeadsResult] = await Promise.all([
    supabase
      .from("leads")
      .select("id, status, estimated_value")
      .eq("workspace_id", workspaceId)
      .eq("assigned_to", userId),
    supabase
      .from("tasks")
      .select("id, status, due_date")
      .eq("workspace_id", workspaceId)
      .eq("assignee_id", userId),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("assigned_to", userId)
      .gte("created_at", monthStartStr),
  ]);

  const myLeads = (myLeadsResult.data ?? []) as { id: string; status: string; estimated_value: number | null }[];
  const myTasks = (myTasksResult.data ?? []) as { id: string; status: string; due_date: string | null }[];
  const newThisMonth = newMonthLeadsResult.count ?? 0;

  /* Pipeline aggregates */
  const stageCounts: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
  const stageValues: Record<string, number> = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0]));
  for (const lead of myLeads) {
    if (lead.status in stageCounts) {
      stageCounts[lead.status] += 1;
      stageValues[lead.status] += lead.estimated_value ?? 0;
    }
  }

  const activeLeads = myLeads.filter((l) => l.status !== "won" && l.status !== "lost");
  const activePipeline = activeLeads.length;
  const activePipelineValue = activeLeads.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0);

  const closedTotal = stageCounts.won + stageCounts.lost;
  const conversionRate = closedTotal > 0 ? Math.round((stageCounts.won / closedTotal) * 100) : 0;

  /* Task status */
  const totalTasks = myTasks.length;
  const completedTasks = myTasks.filter((t) => t.status === "done").length;
  const inProgressTasks = myTasks.filter((t) => t.status === "in_progress").length;
  const overdueTasks = myTasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "done",
  ).length;
  const openTasks = totalTasks - completedTasks;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.greeting}>Welcome back, {displayName}</h2>

        {/* Personal stat cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Pipeline</span>
            <span className={`${styles.statValue} ${styles.statValuePrimary}`}>{activePipeline}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>New This Month</span>
            <span className={styles.statValue}>{newThisMonth}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Conversion Rate</span>
            <span className={styles.statValue}>{conversionRate}%</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Open Tasks</span>
            <span className={`${styles.statValue} ${overdueTasks > 0 ? styles.statValueDanger : ""}`}>
              {openTasks}
            </span>
          </div>
        </div>

        {/* Pipeline by stage */}
        <div className={styles.pipelineCard}>
          <div className={styles.pipelineHeader}>
            <Target size={16} />
            <span className={styles.pipelineTitle}>My Pipeline</span>
            <Link href="/dashboard/leads" className={styles.sectionLink}>View all</Link>
          </div>
          <div className={styles.pipelineStats}>
            {STAGE_ORDER.map((stage, idx) => (
              <Fragment key={stage}>
                {idx > 0 && <div className={styles.pipelineDivider} />}
                <div className={styles.pipelineStat}>
                  <span
                    className={`${styles.pipelineStatValue} ${stage === "won" ? styles.pipelineWon : ""}`}
                  >
                    {stageCounts[stage]}
                  </span>
                  <span className={styles.pipelineStatLabel}>{STAGE_LABELS[stage]}</span>
                  {stageValues[stage] > 0 && (
                    <span className={styles.financeAllTime}>
                      {formatCurrency(stageValues[stage], currency)}
                    </span>
                  )}
                </div>
              </Fragment>
            ))}
          </div>
          {activePipelineValue > 0 && (
            <p style={{
              marginTop: "var(--space-3)",
              color: "var(--color-text-secondary)",
              fontSize: "var(--text-sm)",
            }}>
              Active pipeline value: <strong>{formatCurrency(activePipelineValue, currency)}</strong>
            </p>
          )}
        </div>

        {/* Task status summary */}
        <div className={styles.pipelineCard}>
          <div className={styles.pipelineHeader}>
            <ListTodo size={16} />
            <span className={styles.pipelineTitle}>Task Status</span>
            <Link href="/dashboard/tasks" className={styles.sectionLink}>View all</Link>
          </div>
          <div className={styles.pipelineStats}>
            <div className={styles.pipelineStat}>
              <span className={styles.pipelineStatValue}>{totalTasks}</span>
              <span className={styles.pipelineStatLabel}>Total</span>
            </div>
            <div className={styles.pipelineDivider} />
            <div className={styles.pipelineStat}>
              <span className={`${styles.pipelineStatValue} ${styles.pipelineWon}`}>{completedTasks}</span>
              <span className={styles.pipelineStatLabel}>Completed</span>
            </div>
            <div className={styles.pipelineDivider} />
            <div className={styles.pipelineStat}>
              <span className={styles.pipelineStatValue}>{inProgressTasks}</span>
              <span className={styles.pipelineStatLabel}>In Progress</span>
            </div>
            <div className={styles.pipelineDivider} />
            <div className={styles.pipelineStat}>
              <span className={`${styles.pipelineStatValue} ${overdueTasks > 0 ? styles.financeNegative : ""}`}>
                {overdueTasks}
              </span>
              <span className={styles.pipelineStatLabel}>Overdue</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
