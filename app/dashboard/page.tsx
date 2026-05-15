import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard" };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

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
  const today = getToday();

  const [
    activeClientsResult,
    tasksDueTodayResult,
    overdueTasksResult,
    activeProjectsResult,
    recentClientsResult,
    upcomingTasksResult,
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
    supabase
      .from("tasks")
      .select("id, title, due_date, status, clients(name)")
      .eq("workspace_id", wid)
      .neq("status", "done")
      .not("due_date", "is", null)
      .gte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(5),
  ]);

  const activeClients = activeClientsResult.count ?? 0;
  const tasksDueToday = tasksDueTodayResult.count ?? 0;
  const overdueTasks = overdueTasksResult.count ?? 0;
  const activeProjects = activeProjectsResult.count ?? 0;
  const recentClients = recentClientsResult.data ?? [];
  const upcomingTasks = upcomingTasksResult.data ?? [];

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "there";

  const STATUS_PILL: Record<string, string> = {
    active: "pill pill-success",
    paused: "pill pill-warning",
    completed: "pill pill-info",
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.greeting}>Welcome back, {displayName}</h2>

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

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Upcoming Tasks</h3>
            <Link href="/dashboard/tasks" className={styles.sectionLink}>View all</Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className={styles.emptyText}>No upcoming tasks.</p>
          ) : (
            <div className={styles.itemList}>
              {upcomingTasks.map((task: { id: string; title: string; due_date: string | null; status: string; clients: { name: string }[] | null }) => {
                const clientName = task.clients?.[0]?.name ?? "";
                return (
                <div key={task.id} className={styles.itemRow}>
                  <span className={styles.itemName}>{task.title}</span>
                  <span className={styles.itemSub}>{clientName}</span>
                  {task.due_date && (
                    <span className={`${styles.itemDate} ${task.due_date === today ? styles.itemDateOverdue : ""}`}>
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
