"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskWithRelations, TaskStatus, WorkspaceMemberWithEmail } from "@/lib/types";
import styles from "./kanban-view.module.css";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "review", label: "Review" },
  { status: "done", label: "Done" },
  { status: "blocked", label: "Blocked" },
];

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

const PRIORITY_PILL: Record<string, string> = {
  low: "pill",
  normal: "pill pill-info",
  high: "pill pill-warning",
  urgent: "pill pill-danger",
};

type KanbanViewProps = {
  tasks: TaskWithRelations[];
  members: WorkspaceMemberWithEmail[];
  onTaskClick: (task: Task) => void;
};

export function KanbanView({ tasks, members, onTaskClick }: KanbanViewProps) {
  const router = useRouter();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<TaskStatus | null>(null);
  const dragCounterRef = useRef<Map<string, number>>(new Map());

  const memberMap = new Map(members.map((m) => [m.user_id, m]));

  const tasksByStatus = new Map<TaskStatus, TaskWithRelations[]>();
  for (const col of COLUMNS) {
    tasksByStatus.set(col.status, []);
  }
  for (const task of tasks) {
    const list = tasksByStatus.get(task.status);
    if (list) list.push(task);
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
  }

  function handleDragEnd() {
    setDraggedTaskId(null);
    setActiveColumn(null);
    dragCounterRef.current.clear();
  }

  function handleDragEnter(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    const counter = (dragCounterRef.current.get(status) ?? 0) + 1;
    dragCounterRef.current.set(status, counter);
    setActiveColumn(status);
  }

  function handleDragLeave(status: TaskStatus) {
    const counter = (dragCounterRef.current.get(status) ?? 0) - 1;
    dragCounterRef.current.set(status, counter);
    if (counter <= 0) {
      dragCounterRef.current.set(status, 0);
      if (activeColumn === status) setActiveColumn(null);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: React.DragEvent, newStatus: TaskStatus) {
    e.preventDefault();
    setActiveColumn(null);
    dragCounterRef.current.clear();

    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const supabase = createClient();
    const updates: Record<string, unknown> = { status: newStatus };
    if (newStatus === "done") {
      updates.completed_at = new Date().toISOString();
    } else if (task.status === "done") {
      updates.completed_at = null;
    }

    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) {
      console.error("Failed to move task:", error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className={styles.board}>
      {COLUMNS.map(({ status, label }) => {
        const columnTasks = tasksByStatus.get(status) ?? [];
        return (
          <div key={status} className={styles.column}>
            <div className={styles.columnHeader}>
              <span className={styles.columnTitle}>{label}</span>
              <span className={styles.columnCount}>{columnTasks.length}</span>
            </div>
            <div
              className={`${styles.dropZone} ${activeColumn === status ? styles.dropZoneActive : ""}`}
              onDragEnter={(e) => handleDragEnter(e, status)}
              onDragLeave={() => handleDragLeave(status)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              {columnTasks.length === 0 ? (
                <div className={styles.emptyColumn}>No tasks</div>
              ) : (
                columnTasks.map((task) => {
                  const assignee = task.assignee_id ? memberMap.get(task.assignee_id) : null;
                  const overdue = isOverdue(task.due_date, task.status);

                  return (
                    <div
                      key={task.id}
                      className={`${styles.card} ${draggedTaskId === task.id ? styles.cardDragging : ""}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onTaskClick(task)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onTaskClick(task);
                        }
                      }}
                    >
                      <span className={styles.cardTitle}>{task.title}</span>
                      <div className={styles.cardMeta}>
                        <span className={PRIORITY_PILL[task.priority]} style={{ fontSize: "10px", padding: "1px 6px" }}>
                          {task.priority.toUpperCase()}
                        </span>
                        {assignee && (
                          <span className={styles.cardAvatar} title={assignee.full_name || assignee.email}>
                            {getInitials(assignee.full_name || assignee.email)}
                          </span>
                        )}
                        {task.due_date && (
                          <span className={`${styles.cardDue} ${overdue ? styles.cardDueOverdue : ""}`}>
                            {formatDueDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
