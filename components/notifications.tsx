"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Clock, AlertTriangle, FileText, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasPermission } from "@/lib/permissions";
import type { WorkspaceRole } from "@/lib/types";
import styles from "./notifications.module.css";

type NotificationType = "task_due" | "task_overdue" | "invoice_overdue" | "lead_assigned";

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  subtitle: string;
};

type NotificationBellProps = {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
};

const ICON_MAP: Record<NotificationType, typeof Clock> = {
  task_due: Clock,
  task_overdue: AlertTriangle,
  invoice_overdue: FileText,
  lead_assigned: Target,
};

const LABEL_MAP: Record<NotificationType, string> = {
  task_due: "Due Today",
  task_overdue: "Overdue",
  invoice_overdue: "Invoice",
  lead_assigned: "New Lead",
};

const ICON_STYLE_MAP: Record<NotificationType, string> = {
  task_due: styles.iconTaskDue,
  task_overdue: styles.iconTaskOverdue,
  invoice_overdue: styles.iconInvoiceOverdue,
  lead_assigned: styles.iconLeadAssigned,
};

const TAG_STYLE_MAP: Record<NotificationType, string> = {
  task_due: styles.tagTaskDue,
  task_overdue: styles.tagTaskOverdue,
  invoice_overdue: styles.tagInvoiceOverdue,
  lead_assigned: styles.tagLeadAssigned,
};

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function NotificationBell({ userId, workspaceId, role }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchNotifications() {
      const supabase = createClient();
      const today = getToday();
      const items: Notification[] = [];

      try {
        // Tasks due today (assigned to user)
        const { data: tasksDue } = await supabase
          .from("tasks")
          .select("id, title")
          .eq("workspace_id", workspaceId)
          .eq("assignee_id", userId)
          .eq("due_date", today)
          .neq("status", "done")
          .limit(5);

        if (tasksDue) {
          for (const t of tasksDue) {
            items.push({
              id: `task-due-${t.id}`,
              type: "task_due",
              title: t.title,
              subtitle: "Due today",
            });
          }
        }

        // Overdue tasks (assigned to user)
        const { data: tasksOverdue } = await supabase
          .from("tasks")
          .select("id, title, due_date")
          .eq("workspace_id", workspaceId)
          .eq("assignee_id", userId)
          .lt("due_date", today)
          .neq("status", "done")
          .order("due_date", { ascending: true })
          .limit(5);

        if (tasksOverdue) {
          for (const t of tasksOverdue) {
            items.push({
              id: `task-overdue-${t.id}`,
              type: "task_overdue",
              title: t.title,
              subtitle: `Overdue since ${formatShortDate(t.due_date)}`,
            });
          }
        }

        // Overdue invoices (if user has finance permission)
        if (hasPermission(role, "finance:read")) {
          const { data: invoicesOverdue } = await supabase
            .from("invoices")
            .select("id, invoice_number, due_date")
            .eq("workspace_id", workspaceId)
            .eq("status", "unpaid")
            .lt("due_date", today)
            .limit(5);

          if (invoicesOverdue) {
            for (const inv of invoicesOverdue) {
              items.push({
                id: `invoice-overdue-${inv.id}`,
                type: "invoice_overdue",
                title: inv.invoice_number,
                subtitle: `Due ${formatShortDate(inv.due_date)}`,
              });
            }
          }
        }

        // New leads assigned to user (last 7 days)
        if (hasPermission(role, "leads:read")) {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);

          const { data: newLeads } = await supabase
            .from("leads")
            .select("id, name, company")
            .eq("workspace_id", workspaceId)
            .eq("assigned_to", userId)
            .eq("status", "new")
            .gte("created_at", weekAgo.toISOString())
            .limit(5);

          if (newLeads) {
            for (const lead of newLeads) {
              items.push({
                id: `lead-assigned-${lead.id}`,
                type: "lead_assigned",
                title: lead.company || lead.name,
                subtitle: "New lead assigned to you",
              });
            }
          }
        }
      } catch {
        // Silently fail — notifications are non-critical
      }

      setNotifications(items);
      setIsLoading(false);
    }

    fetchNotifications();
  }, [userId, workspaceId, role]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const count = notifications.length;

  return (
    <div className={styles.bellWrapper} ref={wrapperRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${count > 0 ? ` (${count})` : ""}`}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className={styles.badge}>{count > 9 ? "9+" : count}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Notifications</span>
            {count > 0 && <span className={styles.dropdownCount}>{count}</span>}
          </div>

          {isLoading ? (
            <div className={styles.emptyState}>Loading...</div>
          ) : count === 0 ? (
            <div className={styles.emptyState}>All caught up!</div>
          ) : (
            <div className={styles.notificationList}>
              {notifications.map((n) => {
                const Icon = ICON_MAP[n.type];
                return (
                  <div key={n.id} className={styles.notificationItem}>
                    <div className={`${styles.notificationIcon} ${ICON_STYLE_MAP[n.type]}`}>
                      <Icon size={14} />
                    </div>
                    <div className={styles.notificationContent}>
                      <span className={styles.notificationTitle}>{n.title}</span>
                      <span className={styles.notificationSubtitle}>{n.subtitle}</span>
                    </div>
                    <span className={`${styles.notificationTag} ${TAG_STYLE_MAP[n.type]}`}>
                      {LABEL_MAP[n.type]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
