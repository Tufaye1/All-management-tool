import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CheckSquare,
  Target,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/permissions";
import { formatCurrency } from "@/lib/currency";
import type { WorkspaceRole } from "@/lib/types";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard" };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(dateStr);
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

type ActivityItem = {
  id: string;
  type: "client" | "task" | "lead" | "invoice";
  title: string;
  subtitle: string;
  timestamp: string;
};

export default async function DashboardPage() {
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
  const today = getToday();

  // Get first day of current month for "won this month"
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartStr = monthStart.toISOString().split("T")[0];

  const [
    activeClientsResult,
    tasksDueTodayResult,
    overdueTasksResult,
    activeProjectsResult,
    recentClientsResult,
    myTasksResult,
    profileResult,
    workspaceResult,
    // Pipeline queries
    activeLeadsResult,
    wonLeadsResult,
    // Recent activity queries
    recentTasksActivity,
    recentClientsActivity,
    recentLeadsActivity,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wid)
      .eq("status", "active")
      .is("archived_at", null),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wid)
      .eq("due_date", today)
      .neq("status", "done"),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wid)
      .lt("due_date", today)
      .neq("status", "done"),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", wid)
      .eq("status", "active"),
    supabase
      .from("clients")
      .select("id, name, status, created_at")
      .eq("workspace_id", wid)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(5),
    // My Tasks — assigned to user, not done
    supabase
      .from("tasks")
      .select("id, title, due_date, status, priority, clients(name)")
      .eq("workspace_id", wid)
      .eq("assignee_id", user.id)
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single(),
    supabase
      .from("workspaces")
      .select("currency")
      .eq("id", wid)
      .single(),
    // Active leads (not won/lost) with estimated values
    supabase
      .from("leads")
      .select("id, estimated_value")
      .eq("workspace_id", wid)
      .not("status", "in", "(won,lost)"),
    // Leads won this month
    supabase
      .from("leads")
      .select("id, estimated_value")
      .eq("workspace_id", wid)
      .eq("status", "won")
      .gte("won_date", monthStartStr),
    // Recent activity: tasks
    supabase
      .from("tasks")
      .select("id, title, updated_at")
      .eq("workspace_id", wid)
      .order("updated_at", { ascending: false })
      .limit(4),
    // Recent activity: clients
    supabase
      .from("clients")
      .select("id, name, created_at")
      .eq("workspace_id", wid)
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
    // Recent activity: leads
    supabase
      .from("leads")
      .select("id, company, name, created_at")
      .eq("workspace_id", wid)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const activeClients = activeClientsResult.count ?? 0;
  const tasksDueToday = tasksDueTodayResult.count ?? 0;
  const overdueTasks = overdueTasksResult.count ?? 0;
  const activeProjects = activeProjectsResult.count ?? 0;
  const recentClients = recentClientsResult.data ?? [];
  const myTasks = myTasksResult.data ?? [];
  const currency = workspaceResult.data?.currency ?? "USD";

  const displayName = profileResult.data?.full_name
    || (user.user_metadata?.full_name as string)
    || user.email?.split("@")[0]
    || "there";

  // Pipeline stats
  const activeLeads = activeLeadsResult.data ?? [];
  const pipelineCount = activeLeads.length;
  const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0);
  const wonLeads = wonLeadsResult.data ?? [];
  const wonCount = wonLeads.length;
  const wonValue = wonLeads.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0);

  // Build activity feed
  const activityItems: ActivityItem[] = [];

  for (const t of (recentTasksActivity.data ?? [])) {
    activityItems.push({
      id: `task-${t.id}`,
      type: "task",
      title: t.title,
      subtitle: "Task updated",
      timestamp: t.updated_at,
    });
  }
  for (const c of (recentClientsActivity.data ?? [])) {
    activityItems.push({
      id: `client-${c.id}`,
      type: "client",
      title: c.name,
      subtitle: "Client added",
      timestamp: c.created_at,
    });
  }
  for (const l of (recentLeadsActivity.data ?? [])) {
    activityItems.push({
      id: `lead-${l.id}`,
      type: "lead",
      title: l.company || l.name,
      subtitle: "Lead created",
      timestamp: l.created_at,
    });
  }

  activityItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentActivity = activityItems.slice(0, 8);

  const ACTIVITY_ICON: Record<string, typeof Building2> = {
    client: Building2,
    task: CheckSquare,
    lead: Target,
    invoice: FileText,
  };

  const STATUS_PILL: Record<string, string> = {
    active: "pill pill-success",
    paused: "pill pill-warning",
    completed: "pill pill-info",
  };

  const PRIORITY_STYLE: Record<string, string> = {
    urgent: styles.priorityUrgent,
    high: styles.priorityHigh,
    normal: "",
    low: styles.priorityLow,
  };

  const canSeePipeline = hasPermission(role, "leads:read");

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.greeting}>Welcome back, {displayName}</h2>

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Clients</span>
            <span className={`${styles.statValue} ${styles.statValuePrimary}`}>{activeClients}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Due Today</span>
            <span className={styles.statValue}>{tasksDueToday}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Overdue</span>
            <span className={`${styles.statValue} ${overdueTasks > 0 ? styles.statValueDanger : ""}`}>
              {overdueTasks}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Projects</span>
            <span className={styles.statValue}>{activeProjects}</span>
          </div>
        </div>

        {/* Pipeline Summary */}
        {canSeePipeline && (
          <div className={styles.pipelineCard}>
            <div className={styles.pipelineHeader}>
              <Target size={16} />
              <span className={styles.pipelineTitle}>Pipeline Summary</span>
              <Link href="/dashboard/leads" className={styles.sectionLink}>View pipeline</Link>
            </div>
            <div className={styles.pipelineStats}>
              <div className={styles.pipelineStat}>
                <span className={styles.pipelineStatValue}>{pipelineCount}</span>
                <span className={styles.pipelineStatLabel}>Active Leads</span>
              </div>
              <div className={styles.pipelineDivider} />
              <div className={styles.pipelineStat}>
                <span className={styles.pipelineStatValue}>{formatCurrency(pipelineValue, currency)}</span>
                <span className={styles.pipelineStatLabel}>Pipeline Value</span>
              </div>
              <div className={styles.pipelineDivider} />
              <div className={styles.pipelineStat}>
                <span className={`${styles.pipelineStatValue} ${styles.pipelineWon}`}>{wonCount}</span>
                <span className={styles.pipelineStatLabel}>Won This Month</span>
              </div>
              <div className={styles.pipelineDivider} />
              <div className={styles.pipelineStat}>
                <span className={`${styles.pipelineStatValue} ${styles.pipelineWon}`}>
                  {formatCurrency(wonValue, currency)}
                </span>
                <span className={styles.pipelineStatLabel}>Won Value</span>
              </div>
            </div>
          </div>
        )}

        {/* Two-column layout for My Tasks + Recent Activity */}
        <div className={styles.twoCol}>
          {/* My Tasks */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>My Tasks</h3>
              <Link href="/dashboard/tasks" className={styles.sectionLink}>View all</Link>
            </div>
            {myTasks.length === 0 ? (
              <p className={styles.emptyText}>No tasks assigned to you.</p>
            ) : (
              <div className={styles.itemList}>
                {myTasks.map((task: {
                  id: string;
                  title: string;
                  due_date: string | null;
                  status: string;
                  priority: string;
                  clients: { name: string }[] | null;
                }) => {
                  const clientName = task.clients?.[0]?.name ?? "";
                  const isOverdue = task.due_date ? task.due_date < today : false;
                  return (
                    <div key={task.id} className={styles.itemRow}>
                      <div className={styles.taskInfo}>
                        <span className={styles.itemName}>{task.title}</span>
                        {clientName && <span className={styles.itemSub}>{clientName}</span>}
                      </div>
                      <div className={styles.taskMeta}>
                        {task.priority !== "normal" && (
                          <span className={`${styles.priorityDot} ${PRIORITY_STYLE[task.priority] ?? ""}`} />
                        )}
                        {task.due_date && (
                          <span className={`${styles.itemDate} ${isOverdue ? styles.itemDateOverdue : ""}`}>
                            {isOverdue && <AlertTriangle size={10} />}
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Recent Activity</h3>
            </div>
            {recentActivity.length === 0 ? (
              <p className={styles.emptyText}>No recent activity.</p>
            ) : (
              <div className={styles.activityList}>
                {recentActivity.map((item) => {
                  const Icon = ACTIVITY_ICON[item.type] ?? Clock;
                  return (
                    <div key={item.id} className={styles.activityItem}>
                      <div className={styles.activityIcon}>
                        <Icon size={14} />
                      </div>
                      <div className={styles.activityContent}>
                        <span className={styles.activityTitle}>{item.title}</span>
                        <span className={styles.activitySub}>{item.subtitle}</span>
                      </div>
                      <span className={styles.activityTime}>{timeAgo(item.timestamp)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Clients */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Recent Clients</h3>
            <Link href="/dashboard/clients" className={styles.sectionLink}>View all</Link>
          </div>
          {recentClients.length === 0 ? (
            <p className={styles.emptyText}>No clients yet.</p>
          ) : (
            <div className={styles.itemList}>
              {recentClients.map((client: { id: string; name: string; status: string; created_at: string }) => (
                <Link
                  key={client.id}
                  href={`/dashboard/clients/${client.id}`}
                  className={styles.itemRow}
                >
                  <span className={styles.itemName}>{client.name}</span>
                  <span className={STATUS_PILL[client.status]}>{client.status.toUpperCase()}</span>
                  <span className={styles.itemDate}>{formatDate(client.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
