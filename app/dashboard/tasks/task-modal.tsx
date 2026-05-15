"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import type { Task, TaskStatus, FunctionTag, Priority, Client, Project, WorkspaceMemberWithEmail } from "@/lib/types";
import modalStyles from "../clients/clients.module.css";

type TaskModalProps = {
  workspaceId: string;
  userId: string;
  clients: Client[];
  members: WorkspaceMemberWithEmail[];
  task?: Task | null;
  onClose: () => void;
};

export function TaskModal({ workspaceId, userId, clients, members, task, onClose }: TaskModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [clientId, setClientId] = useState(task?.client_id ?? "");
  const [projectId, setProjectId] = useState(task?.project_id ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "todo");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "normal");
  const [functionTag, setFunctionTag] = useState<FunctionTag>(task?.function_tag ?? "admin");
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!clientId) {
      setProjects([]);
      setProjectId("");
      return;
    }
    const supabase = createClient();
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", clientId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects((data as Project[]) ?? []);
        if (!data?.find((p) => p.id === projectId)) {
          setProjectId(data?.[0]?.id ?? "");
        }
      });
  }, [clientId, workspaceId, projectId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!clientId || !projectId) {
      setError("Client and project are required.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const payload = {
      title,
      description: description || null,
      status,
      priority,
      function_tag: functionTag,
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("tasks")
        .update({ ...payload, client_id: clientId, project_id: projectId })
        .eq("id", task.id);

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("tasks")
        .insert({
          ...payload,
          workspace_id: workspaceId,
          client_id: clientId,
          project_id: projectId,
          reporter_id: userId,
        });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
    }

    toast(isEditing ? "Task updated" : "Task created");
    router.refresh();
    onClose();
  }

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <h3 className={modalStyles.modalTitle}>
            {isEditing ? "Edit Task" : "Add Task"}
          </h3>
          <button type="button" className={modalStyles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <p className={modalStyles.error}>{error}</p>}

        <form className={modalStyles.form} onSubmit={handleSubmit}>
          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="task-title">Title *</label>
            <input
              id="task-title"
              className={modalStyles.input}
              type="text"
              placeholder="Design landing page mockup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="task-desc">Description</label>
            <textarea
              id="task-desc"
              className={modalStyles.textarea}
              placeholder="What needs to be done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            <div className={modalStyles.inputGroup} style={{ flex: 1 }}>
              <label className={modalStyles.label} htmlFor="task-client">Client *</label>
              <select
                id="task-client"
                className={modalStyles.select}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className={modalStyles.inputGroup} style={{ flex: 1 }}>
              <label className={modalStyles.label} htmlFor="task-project">Project *</label>
              <select
                id="task-project"
                className={modalStyles.select}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                disabled={!clientId}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            <div className={modalStyles.inputGroup} style={{ flex: 1 }}>
              <label className={modalStyles.label} htmlFor="task-status">Status</label>
              <select
                id="task-status"
                className={modalStyles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div className={modalStyles.inputGroup} style={{ flex: 1 }}>
              <label className={modalStyles.label} htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                className={modalStyles.select}
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            <div className={modalStyles.inputGroup} style={{ flex: 1 }}>
              <label className={modalStyles.label} htmlFor="task-function">Function</label>
              <select
                id="task-function"
                className={modalStyles.select}
                value={functionTag}
                onChange={(e) => setFunctionTag(e.target.value as FunctionTag)}
              >
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
                <option value="strategy">Strategy</option>
                <option value="content">Content</option>
                <option value="ads">Ads</option>
                <option value="analytics">Analytics</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className={modalStyles.inputGroup} style={{ flex: 1 }}>
              <label className={modalStyles.label} htmlFor="task-assignee">Assignee</label>
              <select
                id="task-assignee"
                className={modalStyles.select}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="task-due">Due date</label>
            <input
              id="task-due"
              className={modalStyles.input}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className={modalStyles.formActions}>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isLoading}>
              {isLoading
                ? (isEditing ? "Saving..." : "Adding...")
                : (isEditing ? "Save Changes" : "Add Task")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
