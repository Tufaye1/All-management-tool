"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import type { Project, ProjectStatus } from "@/lib/types";
import styles from "../clients.module.css";

type ProjectModalProps = {
  workspaceId: string;
  clientId: string;
  project?: Project | null;
  onClose: () => void;
};

export function ProjectModal({ workspaceId, clientId, project, onClose }: ProjectModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "planning");
  const [startDate, setStartDate] = useState(project?.start_date ?? "");
  const [endDate, setEndDate] = useState(project?.end_date ?? "");
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

    if (isEditing) {
      const { error } = await supabase
        .from("projects")
        .update(payload)
        .eq("id", project.id);

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("projects")
        .insert({ ...payload, workspace_id: workspaceId, client_id: clientId });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
    }

    toast(isEditing ? "Project updated" : "Project created");
    router.refresh();
    onClose();
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

          <div className={styles.formActions}>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isLoading}>
              {isLoading
                ? (isEditing ? "Saving..." : "Adding...")
                : (isEditing ? "Save Changes" : "Add Project")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
