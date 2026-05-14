"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { Client } from "@/lib/types";
import { ClientModal } from "./client-modal";
import styles from "./clients.module.css";

const STATUS_PILL: Record<string, string> = {
  active: "pill pill-success",
  paused: "pill pill-warning",
  completed: "pill pill-info",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type ClientListProps = {
  clients: Client[];
  workspaceId: string;
  canEdit: boolean;
};

export function ClientList({ clients, workspaceId, canEdit }: ClientListProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  function handleRowClick(client: Client) {
    if (!canEdit) return;
    setEditingClient(client);
  }

  return (
    <>
      <div className={styles.header}>
        <h2 className={styles.title}>Clients</h2>
        {canEdit && (
          <button className="primary" onClick={() => setShowModal(true)}>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Plus size={18} />
              Add Client
            </span>
          </button>
        )}
      </div>

      {clients.length === 0 ? (
        <div className={styles.empty}>
          No clients yet. Add your first client to get started.
        </div>
      ) : (
        <div className={styles.list}>
          {clients.map((client) => (
            <div
              key={client.id}
              className={styles.row}
              onClick={() => handleRowClick(client)}
              role={canEdit ? "button" : undefined}
              tabIndex={canEdit ? 0 : undefined}
              onKeyDown={(e) => {
                if (canEdit && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  handleRowClick(client);
                }
              }}
            >
              <div className={styles.rowMain}>
                <span className={styles.clientName}>{client.name}</span>
                {client.contact_name && (
                  <span className={styles.contactLine}>
                    {client.contact_name}
                    {client.contact_email ? ` · ${client.contact_email}` : ""}
                  </span>
                )}
              </div>
              <div className={styles.rowRight}>
                <span className={STATUS_PILL[client.status]}>
                  {client.status.toUpperCase()}
                </span>
                <span className={styles.date}>
                  {formatDate(client.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ClientModal
          workspaceId={workspaceId}
          onClose={() => setShowModal(false)}
        />
      )}

      {editingClient && (
        <ClientModal
          workspaceId={workspaceId}
          client={editingClient}
          onClose={() => setEditingClient(null)}
        />
      )}
    </>
  );
}
