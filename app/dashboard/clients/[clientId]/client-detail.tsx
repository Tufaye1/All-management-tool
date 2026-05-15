"use client";

import { useState } from "react";
import { Plus, FolderOpen } from "lucide-react";
import type { Client, Project } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProjectModal } from "./project-modal";
import { SlackMessages } from "./slack-messages";
import styles from "./detail.module.css";

const PROJECT_STATUS_PILL: Record<string, string> = {
  planning: "pill pill-info",
  active: "pill pill-success",
  review: "pill pill-warning",
  completed: "pill pill-success",
  paused: "pill pill-info",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return null;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

type TemplateSummary = {
  id: string;
  name: string;
  taskCount: number;
};

type ClientDetailProps = {
  client: Client;
  projects: Project[];
  workspaceId: string;
  canEdit: boolean;
  templates?: TemplateSummary[];
  driveConnected?: boolean;
  slackConnected?: boolean;
};

export function ClientDetail({
  client,
  projects,
  workspaceId,
  canEdit,
  templates = [],
  driveConnected = false,
  slackConnected = false,
}: ClientDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "projects" | "slack">("overview");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "projects" as const, label: `Projects (${projects.length})` },
    ...(slackConnected ? [{ key: "slack" as const, label: "Slack" }] : []),
  ];

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Breadcrumbs crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clients", href: "/dashboard/clients" },
          { label: client.name },
        ]} />

        <div className={styles.clientHeader}>
          <h2 className={styles.clientName}>{client.name}</h2>
          <span className={PROJECT_STATUS_PILL[client.status] ?? "pill pill-info"}>
            {client.status.toUpperCase()}
          </span>
        </div>

        <div className={styles.tabs}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.tab} ${activeTab === key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Contact Name</span>
                <span className={styles.infoValue}>{client.contact_name || "—"}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{client.contact_email || "—"}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{client.contact_phone || "—"}</span>
              </div>
              <div className={styles.infoCard}>
                <span className={styles.infoLabel}>Status</span>
                <span className={styles.infoValue} style={{ textTransform: "capitalize" }}>
                  {client.status}
                </span>
              </div>
            </div>
            {client.notes && (
              <div className={styles.notesCard}>
                <span className={styles.infoLabel}>Notes</span>
                <p className={styles.notesText}>{client.notes}</p>
              </div>
            )}
          </>
        )}

        {activeTab === "projects" && (
          <>
            <div className={styles.projectsHeader}>
              <span className={styles.projectsTitle}>Projects</span>
              {canEdit && (
                <button className="primary" onClick={() => setShowModal(true)}>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Plus size={18} />
                    Add Project
                  </span>
                </button>
              )}
            </div>

            {projects.length === 0 ? (
              <div className={styles.empty}>
                No projects yet. Add your first project for this client.
              </div>
            ) : (
              <div className={styles.projectList}>
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className={styles.projectCard}
                    onClick={() => canEdit && setEditingProject(project)}
                    role={canEdit ? "button" : undefined}
                    tabIndex={canEdit ? 0 : undefined}
                    onKeyDown={(e) => {
                      if (canEdit && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        setEditingProject(project);
                      }
                    }}
                  >
                    <div className={styles.projectCardTop}>
                      <span className={styles.projectName}>{project.name}</span>
                      <span className={PROJECT_STATUS_PILL[project.status]}>
                        {project.status.toUpperCase()}
                      </span>
                    </div>
                    {formatDateRange(project.start_date, project.end_date) && (
                      <p className={styles.projectDates}>
                        {formatDateRange(project.start_date, project.end_date)}
                      </p>
                    )}
                    {project.description && (
                      <p className={styles.projectDesc}>{project.description}</p>
                    )}
                    {project.drive_folder_url && (
                      <a
                        href={project.drive_folder_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.driveFolderLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FolderOpen size={12} />
                        Open Drive Folder
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showModal && (
              <ProjectModal
                workspaceId={workspaceId}
                clientId={client.id}
                clientName={client.name}
                onClose={() => setShowModal(false)}
                templates={templates}
                driveConnected={driveConnected}
              />
            )}

            {editingProject && (
              <ProjectModal
                workspaceId={workspaceId}
                clientId={client.id}
                clientName={client.name}
                project={editingProject}
                onClose={() => setEditingProject(null)}
              />
            )}
          </>
        )}

        {activeTab === "slack" && slackConnected && (
          <SlackMessages
            workspaceId={workspaceId}
            clientId={client.id}
            initialChannelId={client.slack_channel_id}
          />
        )}
      </div>
    </div>
  );
}
