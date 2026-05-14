"use client";

import { useState } from "react";
import { Plus, Filter, X } from "lucide-react";
import type { Task, TaskWithRelations, Client, WorkspaceMemberWithEmail } from "@/lib/types";
import { TaskModal } from "./task-modal";
import styles from "./tasks.module.css";

const STATUS_PILL: Record<string, string> = {
  todo: "pill pill-info",
  in_progress: "pill pill-success",
  review: "pill pill-warning",
  done: "pill pill-success",
  blocked: "pill pill-danger",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "TO DO",
  in_progress: "IN PROGRESS",
  review: "REVIEW",
  done: "DONE",
  blocked: "BLOCKED",
};

const FUNCTION_PILL: Record<string, string> = {
  design: "pill pill-info",
  marketing: "pill pill-success",
  strategy: "pill pill-warning",
  content: "pill pill-info",
  ads: "pill pill-danger",
  analytics: "pill pill-info",
  admin: "pill pill-info",
};

const PRIORITY_PILL: Record<string, string> = {
  low: `pill ${styles.pillLow}`,
  normal: `pill ${styles.pillNormal}`,
  high: `pill ${styles.pillHigh}`,
  urgent: `pill ${styles.pillUrgent}`,
};

function getInitials(str: string) {
  return str.slice(0, 2).toUpperCase();
}

function formatDueDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr: string | null, status: string) {
  if (!dateStr || status === "done") return false;
  return new Date(dateStr + "T23:59:59") < new Date();
}

type Filters = {
  client: string;
  function_tag: string;
  assignee: string;
  status: string;
  priority: string;
};

type TaskListProps = {
  tasks: TaskWithRelations[];
  clients: Client[];
  members: WorkspaceMemberWithEmail[];
  workspaceId: string;
  userId: string;
  canEdit: boolean;
};

export function TaskList({ tasks, clients, members, workspaceId, userId, canEdit }: TaskListProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    client: "",
    function_tag: "",
    assignee: "",
    status: "",
    priority: "",
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const filtered = tasks.filter((t) => {
    if (filters.client && t.client_id !== filters.client) return false;
    if (filters.function_tag && t.function_tag !== filters.function_tag) return false;
    if (filters.assignee && t.assignee_id !== filters.assignee) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  const memberMap = new Map(members.map((m) => [m.user_id, m]));

  function renderFilterSelects(selectClass: string) {
    return (
      <>
        <select className={selectClass} value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })}>
          <option value="">All Clients</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={selectClass} value={filters.function_tag} onChange={(e) => setFilters({ ...filters, function_tag: e.target.value })}>
          <option value="">All Functions</option>
          {["design", "marketing", "strategy", "content", "ads", "analytics", "admin"].map((f) => (
            <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
          ))}
        </select>
        <select className={selectClass} value={filters.assignee} onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}>
          <option value="">All Assignees</option>
          {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}
        </select>
        <select className={selectClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={selectClass} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priorities</option>
          {["low", "normal", "high", "urgent"].map((p) => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Tasks</h2>
          {canEdit && (
            <button className="primary" onClick={() => setShowModal(true)}>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Plus size={18} />
                Add Task
              </span>
            </button>
          )}
        </div>

        {/* Desktop filters */}
        <div className={styles.filterBar}>
          {renderFilterSelects(styles.filterSelect)}
        </div>

        {/* Mobile filter toggle */}
        <div className={styles.mobileFilterToggle}>
          <button
            className={styles.filterToggleButton}
            onClick={() => setShowMobileFilters(true)}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className={styles.activeFilterCount}>{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Mobile filter sheet */}
        {showMobileFilters && (
          <div className={styles.mobileSheet}>
            <div className={styles.mobileSheetBackdrop} onClick={() => setShowMobileFilters(false)} />
            <div className={styles.mobileSheetContent}>
              <div className={styles.mobileSheetHeader}>
                <span className={styles.mobileSheetTitle}>Filters</span>
                <button className={styles.mobileSheetClose} onClick={() => setShowMobileFilters(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className={styles.mobileFilterGroup}>
                <span className={styles.mobileFilterLabel}>Client</span>
                <select className={styles.mobileFilterSelect} value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })}>
                  <option value="">All Clients</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className={styles.mobileFilterGroup}>
                <span className={styles.mobileFilterLabel}>Function</span>
                <select className={styles.mobileFilterSelect} value={filters.function_tag} onChange={(e) => setFilters({ ...filters, function_tag: e.target.value })}>
                  <option value="">All Functions</option>
                  {["design", "marketing", "strategy", "content", "ads", "analytics", "admin"].map((f) => (
                    <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className={styles.mobileFilterGroup}>
                <span className={styles.mobileFilterLabel}>Assignee</span>
                <select className={styles.mobileFilterSelect} value={filters.assignee} onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}>
                  <option value="">All Assignees</option>
                  {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>)}
                </select>
              </div>
              <div className={styles.mobileFilterGroup}>
                <span className={styles.mobileFilterLabel}>Status</span>
                <select className={styles.mobileFilterSelect} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                  <option value="">All Statuses</option>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className={styles.mobileFilterGroup}>
                <span className={styles.mobileFilterLabel}>Priority</span>
                <select className={styles.mobileFilterSelect} value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
                  <option value="">All Priorities</option>
                  {["low", "normal", "high", "urgent"].map((p) => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <button className="primary" onClick={() => setShowMobileFilters(false)} style={{ marginTop: "var(--space-2)" }}>
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Task list */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            {tasks.length === 0
              ? "No tasks yet. Add your first task to get started."
              : "No tasks match the current filters."}
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map((task) => {
              const assignee = task.assignee_id ? memberMap.get(task.assignee_id) : null;
              const overdue = isOverdue(task.due_date, task.status);

              return (
                <div
                  key={task.id}
                  className={styles.row}
                  onClick={() => canEdit && setEditingTask(task)}
                  role={canEdit ? "button" : undefined}
                  tabIndex={canEdit ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (canEdit && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setEditingTask(task);
                    }
                  }}
                >
                  <div className={styles.rowLeft}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    <span className={styles.taskSub}>
                      {task.projects?.name ?? "Unknown project"}
                      {" · "}
                      {task.clients?.name ?? "Unknown client"}
                    </span>
                  </div>
                  <div className={styles.rowMiddle}>
                    <span className={FUNCTION_PILL[task.function_tag]}>
                      {task.function_tag.toUpperCase()}
                    </span>
                    <span className={PRIORITY_PILL[task.priority]}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className={styles.rowRight}>
                    {assignee ? (
                      <span className={styles.avatar} title={assignee.full_name || assignee.email}>
                        {getInitials(assignee.full_name || assignee.email)}
                      </span>
                    ) : (
                      <span className={styles.avatarEmpty} />
                    )}
                    {task.due_date && (
                      <span className={`${styles.dueDate} ${overdue ? styles.dueDateOverdue : ""}`}>
                        {formatDueDate(task.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showModal && (
          <TaskModal
            workspaceId={workspaceId}
            userId={userId}
            clients={clients}
            members={members}
            onClose={() => setShowModal(false)}
          />
        )}

        {editingTask && (
          <TaskModal
            workspaceId={workspaceId}
            userId={userId}
            clients={clients}
            members={members}
            task={editingTask}
            onClose={() => setEditingTask(null)}
          />
        )}
      </div>
    </div>
  );
}
