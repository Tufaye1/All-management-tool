"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import type { Project, ProjectStatus } from "@/lib/types";
import styles from "../clients.module.css";

type TemplateSummary = {
  id: string;
  name: string;
  taskCount: number;
};

type ProjectModalProps = {
  workspaceId: string;
  clientId: string;
  clientName: string;
  project?: Project | null;
  onClose: () => void;
  templates?: TemplateSummary[];
  driveConnected?: boolean;
};

export function ProjectModal({
  workspaceId,
  clientId,
  clientName,
  project,
  onClose,
  templates = [],
  driveConnected = false,
}: ProjectModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "planning");
  const [startDate, setStartDate] = useState(project?.start_date ?? "");
  const [endDate, setEndDate] = useState(project?.end_date ?? "");
  const [templateId, setTemplateId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!project;

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const payload = {
      name,
      description: description || null,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
    };

    try {
      if (isEditing) {
        const { error } = await supabase
          .from("projects")
          .update(payload)
          .eq("id", project.id);

        if (error) {
          setError(error.message);
          return;
        }
      } else {
        const { data: newProject, error } = await supabase
          .from("projects")
          .insert({ ...payload, workspace_id: workspaceId, client_id: clientId })
          .select("id")
          .single();

        if (error || !newProject) {
          setError(error?.message ?? "Failed to create project");
          return;
        }

        // Create template tasks if a template was selected
        if (templateId) {
          await createTemplateTasks(supabase, newProject.id, templateId, startDate);
        }

        // Create Drive folder if connected
        if (driveConnected) {
          try {
            await fetch("/api/integrations/google-drive/create-folder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                projectId: newProject.id,
                clientName,
                projectName: name,
                workspaceId,
              }),
            });
          } catch {
            // Non-blocking — folder creation failure shouldn't block project creation
          }
        }
      }

      toast(isEditing ? "Project updated" : "Project created");
      router.refresh();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  async function createTemplateTasks(
    supabase: ReturnType<typeof createClient>,
    projectId: string,
    selectedTemplateId: string,
    projectStartDate: string,
  ) {
    const { data: templateTasks } = await supabase
      .from("template_tasks")
      .select("title, description, function_tag, priority, due_days_from_start, position")
      .eq("template_id", selectedTemplateId)
      .order("position");

    if (!templateTasks || templateTasks.length === 0) return;

    const baseDate = projectStartDate ? new Date(projectStartDate) : new Date();

    const tasks = templateTasks.map((t) => {
      const dueDate = new Date(baseDate);
      dueDate.setDate(dueDate.getDate() + t.due_days_from_start);

      return {
        workspace_id: workspaceId,
        project_id: projectId,
        client_id: clientId,
        title: t.title,
        description: t.description,
        function_tag: t.function_tag,
        priority: t.priority,
        status: "todo" as const,
        due_date: dueDate.toISOString().split("T")[0],
        position: t.position,
      };
    });

    await supabase.from("tasks").insert(tasks);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? "Edit Project" : "Add Project"}
          </h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="project-name">Project name *</label>
            <input
              id="project-name"
              className={styles.input}
              type="text"
              placeholder="Spring 2026 Campaign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="project-desc">Description</label>
            <textarea
              id="project-desc"
              className={styles.textarea}
              placeholder="What this project covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="project-status">Status</label>
            <select
              id="project-status"
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="review">Review</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label} htmlFor="start-date">Start date</label>
              <input
                id="start-date"
                className={styles.input}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label className={styles.label} htmlFor="end-date">End date</label>
              <input
                id="end-date"
                className={styles.input}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {!isEditing && templates.length > 0 && (
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="project-template">Use template?</label>
              <select
                id="project-template"
                className={styles.select}
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">No template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.taskCount} tasks)
                  </option>
                ))}
              </select>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                Auto-creates tasks from the selected template.
              </span>
            </div>
          )}

          <div className={styles.formActions}>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isLoading}>
              {isLoading
                ? (isEditing ? "Saving..." : "Creating...")
                : (isEditing ? "Save Changes" : "Add Project")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
