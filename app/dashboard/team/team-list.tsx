"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { WorkspaceMemberWithEmail, Invitation, WorkspaceRole } from "@/lib/types";
import { InviteModal } from "./invite-modal";
import styles from "./team.module.css";

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  admin: "Admin",
  account_lead: "Account Lead",
  team_member: "Team Member",
  finance: "Finance",
  viewer: "Viewer",
};

const ROLE_PILL: Record<WorkspaceRole, string> = {
  admin: styles.pillAdmin,
  account_lead: styles.pillAccountLead,
  team_member: styles.pillTeamMember,
  finance: styles.pillFinance,
  viewer: styles.pillViewer,
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

type TeamListProps = {
  members: WorkspaceMemberWithEmail[];
  invitations: Invitation[];
  workspaceId: string;
  currentUserId: string;
  isAdmin: boolean;
};

export function TeamList({ members, invitations, workspaceId, currentUserId, isAdmin }: TeamListProps) {
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function handleRoleChange(memberId: string, newRole: WorkspaceRole) {
    const supabase = createClient();
    const { error } = await supabase
      .from("workspace_members")
      .update({ role: newRole })
      .eq("id", memberId);

    if (error) {
      console.error("Failed to update role:", error.message);
      return;
    }
    router.refresh();
  }

  async function handleRemove(memberId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("Failed to remove member:", error.message);
      return;
    }
    setRemoving(null);
    router.refresh();
  }

  async function handleRevoke(invitationId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("invitations")
      .delete()
      .eq("id", invitationId);

    if (error) {
      console.error("Failed to revoke invitation:", error.message);
      return;
    }
    router.refresh();
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const pendingInvitations = invitations.filter((inv) => !inv.accepted_at);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Team</h2>
          {isAdmin && (
            <button className="primary" onClick={() => setShowInviteModal(true)}>
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Plus size={18} />
                Invite Member
              </span>
            </button>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Current Members ({members.length})
          </h3>
          {members.length === 0 ? (
            <div className={styles.empty}>No members found.</div>
          ) : (
            <div className={styles.list}>
              {members.map((member) => {
                const isSelf = member.user_id === currentUserId;
                return (
                  <div key={member.id} className={styles.memberRow}>
                    <div className={styles.avatar}>
                      {getInitials(member.full_name, member.email)}
                    </div>
                    <div className={styles.memberInfo}>
                      <span className={styles.memberName}>
                        {member.full_name || member.email.split("@")[0]}
                        {isSelf ? " (you)" : ""}
                      </span>
                      <span className={styles.memberEmail}>{member.email}</span>
                    </div>
                    <div className={styles.memberRight}>
                      <span className={styles.joinDate}>
                        Joined {formatDate(member.created_at)}
                      </span>
                      {isAdmin && !isSelf ? (
                        <select
                          className={styles.roleSelect}
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as WorkspaceRole)}
                        >
                          <option value="admin">Admin</option>
                          <option value="account_lead">Account Lead</option>
                          <option value="team_member">Team Member</option>
                          <option value="finance">Finance</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className={`pill ${ROLE_PILL[member.role]}`}>
                          {ROLE_LABELS[member.role]}
                        </span>
                      )}
                      {isAdmin && !isSelf && (
                        <button
                          className={styles.removeButton}
                          onClick={() => setRemoving(member.id)}
                          aria-label={`Remove ${member.full_name || member.email}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isAdmin && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Pending Invitations ({pendingInvitations.length})
            </h3>
            {pendingInvitations.length === 0 ? (
              <div className={styles.empty}>No pending invitations.</div>
            ) : (
              <div className={styles.list}>
                {pendingInvitations.map((inv) => (
                  <div key={inv.id} className={styles.inviteRow}>
                    <div className={styles.avatar}>
                      {inv.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.inviteInfo}>
                      <span className={styles.inviteEmail}>{inv.email}</span>
                      <span className={styles.inviteMeta}>
                        {ROLE_LABELS[inv.role]} · Expires {formatDate(inv.expires_at)}
                      </span>
                    </div>
                    <div className={styles.memberRight}>
                      <button
                        className="secondary"
                        style={{ padding: "var(--space-2) var(--space-3)", fontSize: "var(--text-sm)" }}
                        onClick={() => copyInviteLink(inv.token)}
                        aria-label="Copy invite link"
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                          {copiedToken === inv.token ? <Check size={14} /> : <Copy size={14} />}
                          {copiedToken === inv.token ? "Copied" : "Copy Link"}
                        </span>
                      </button>
                      <button
                        className={styles.revokeButton}
                        onClick={() => handleRevoke(inv.id)}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {removing && (
        <div className={styles.confirmOverlay} onClick={() => setRemoving(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmText}>
              Remove this member from the workspace? They will lose all access.
            </p>
            <div className={styles.confirmActions}>
              <button className="secondary" onClick={() => setRemoving(null)}>
                Cancel
              </button>
              <button className={styles.dangerButton} onClick={() => handleRemove(removing)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <InviteModal
          workspaceId={workspaceId}
          invitedBy={currentUserId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}
