"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskStatus, FunctionTag, Priority, Client, WorkspaceMemberWithEmail } from "@/lib/types";
import styles from "./task-panel.module.css";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const FUNCTION_OPTIONS: { value: FunctionTag; label: string }[] = [
  { value: "design", label: "Design" },
  { value: "marketing", label: "Marketing" },
  { value: "strategy", label: "Strategy" },
  { value: "content", label: "Content" },
  { value: "ads", label: "Ads" },
  { value: "analytics", label: "Analytics" },
  { value: "admin", label: "Admin" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

type TaskPanelProps = {
  task: Task;
  clients: Client[];
  members: WorkspaceMemberWithEmail[];
  canEdit: boolean;
  onClose: () => void;
};

export function TaskPanel({ task, clients, members, canEdit, onClose }: TaskPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [functionTag, setFunctionTag] = useState<FunctionTag>(task.function_tag);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assignee_id ?? "");
  const [dueDate, setDueDate] = useState(task.due_date ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Auto-save on field changes with debounce
  function scheduleAutoSave(updates: Record<string, unknown>) {
    if (!canEdit) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveField(updates), 600);
  }

  async function saveField(updates: Record<string, unknown>) {
    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", task.id);

    if (error) {
      console.error("Failed to save:", error.message);
    } else {
      setLastSaved(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      router.refresh();
    }
    setIsSaving(false);
  }

  function handleTitleBlur() {
    if (title !== task.title && title.trim()) {
      saveField({ title: title.trim() });
    }
  }

  function handleDescriptionBlur() {
    if (description !== (task.description ?? "")) {
      saveField({ description: description || null });
    }
  }

  const clientName = clients.find((c) => c.id === task.client_id)?.name ?? "Unknown";

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={panelRef}
        className={styles.panel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.panelHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.headerSub}>{clientName}</span>
            {isSaving && <span className={styles.savingIndicator}>Saving...</span>}
            {!isSaving && lastSaved && <span className={styles.savedIndicator}>Saved {lastSaved}</span>}
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className={styles.panelBody}>
          {/* Title — editable inline */}
          <input
            className={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            disabled={!canEdit}
            placeholder="Task title"
          />

          {/* Description — editable */}
          <textarea
            className={styles.descriptionInput}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            disabled={!canEdit}
            placeholder="Add a description..."
            rows={4}
          />

          {/* Fields grid */}
          <div className={styles.fieldsGrid}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Status</span>
              <select
                className={styles.fieldSelect}
                value={status}
                disabled={!canEdit}
                onChange={(e) => {
                  const val = e.target.value as TaskStatus;
                  setStatus(val);
                  saveField({ status: val, completed_at: val === "done" ? new Date().toISOString() : null });
                }}
              >
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Priority</span>
              <select
                className={styles.fieldSelect}
                value={priority}
                disabled={!canEdit}
                onChange={(e) => {
                  const val = e.target.value as Priority;
                  setPriority(val);
                  saveField({ priority: val });
                }}
              >
                {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Function</span>
              <select
                className={styles.fieldSelect}
                value={functionTag}
                disabled={!canEdit}
                onChange={(e) => {
                  const val = e.target.value as FunctionTag;
                  setFunctionTag(val);
                  saveField({ function_tag: val });
                }}
              >
                {FUNCTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Assignee</span>
              <select
                className={styles.fieldSelect}
                value={assigneeId}
                disabled={!canEdit}
                onChange={(e) => {
                  const val = e.target.value;
                  setAssigneeId(val);
                  saveField({ assignee_id: val || null });
                }}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Due Date</span>
              <input
                type="date"
                className={styles.fieldSelect}
                value={dueDate}
                disabled={!canEdit}
                onChange={(e) => {
                  const val = e.target.value;
                  setDueDate(val);
                  scheduleAutoSave({ due_date: val || null });
                }}
              />
            </div>
          </div>

          {/* Activity placeholder */}
          <div className={styles.activitySection}>
            <h4 className={styles.activityTitle}>Activity</h4>
            <p className={styles.activityPlaceholder}>
              Activity log coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
