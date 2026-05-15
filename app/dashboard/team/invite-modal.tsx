"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { WorkspaceRole } from "@/lib/types";
import styles from "../clients/clients.module.css";

type InviteModalProps = {
  workspaceId: string;
  invitedBy: string;
  onClose: () => void;
};

export function InviteModal({ workspaceId, invitedBy, onClose }: InviteModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("team_member");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error: existingError, data: existing } = await supabase
      .from("invitations")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", email.toLowerCase().trim())
      .is("accepted_at", null)
      .limit(1);

    if (existingError) {
      setError(existingError.message);
      setIsLoading(false);
      return;
    }

    if (existing && existing.length > 0) {
      setError("This email already has a pending invitation.");
      setIsLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("invitations")
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase().trim(),
        role,
        invited_by: invitedBy,
        token,
        expires_at: expiresAt,
      });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Invite Team Member</h3>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="invite-email">Email address *</label>
            <input
              id="invite-email"
              className={styles.input}
              type="email"
              placeholder="colleague@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="invite-role">Role</label>
            <select
              id="invite-role"
              className={styles.select}
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
            >
              <option value="account_lead">Account Lead</option>
              <option value="team_member">Team Member</option>
              <option value="finance">Finance</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>

          <p style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-tertiary)",
            margin: 0,
          }}>
            A shareable invite link will be generated. Share it with your teammate to join.
          </p>

          <div className={styles.formActions}>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isLoading}>
              {isLoading ? "Sending..." : "Create Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
