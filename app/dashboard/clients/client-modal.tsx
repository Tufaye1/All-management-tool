"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Client, ClientStatus } from "@/lib/types";
import styles from "./clients.module.css";

type ClientModalProps = {
  workspaceId: string;
  client?: Client | null;
  onClose: () => void;
};

export function ClientModal({ workspaceId, client, onClose }: ClientModalProps) {
  const router = useRouter();
  const [name, setName] = useState(client?.name ?? "");
  const [contactName, setContactName] = useState(client?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(client?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(client?.contact_phone ?? "");
  const [status, setStatus] = useState<ClientStatus>(client?.status ?? "active");
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!client;

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
      contact_name: contactName || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      status,
      notes: notes || null,
    };

    if (isEditing) {
      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", client.id);

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("clients")
        .insert({ ...payload, workspace_id: workspaceId });

      if (error) {
        setError(error.message);
        setIsLoading(false);
        return;
      }
    }

    router.refresh();
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? "Edit Client" : "Add Client"}
          </h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="client-name">Client name *</label>
            <input
              id="client-name"
              className={styles.input}
              type="text"
              placeholder="Acme University"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="contact-name">Contact name</label>
            <input
              id="contact-name"
              className={styles.input}
              type="text"
              placeholder="Jane Smith"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="contact-email">Contact email</label>
            <input
              id="contact-email"
              className={styles.input}
              type="email"
              placeholder="jane@acme.edu"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="contact-phone">Contact phone</label>
            <input
              id="contact-phone"
              className={styles.input}
              type="tel"
              placeholder="+1 555 123 4567"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>

          {isEditing && (
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="status">Status</label>
              <select
                id="status"
                className={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value as ClientStatus)}
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              className={styles.textarea}
              placeholder="Any additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isLoading}>
              {isLoading
                ? (isEditing ? "Saving..." : "Adding...")
                : (isEditing ? "Save Changes" : "Add Client")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
