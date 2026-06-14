"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Copy, Check, Ban, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import type { WorkspaceMemberWithEmail, Invitation, WorkspaceRole, WorkspaceMemberStatus } from "@/lib/types";
import { InviteModal } from "./invite-modal";
import styles from "./team.module.css";

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  admin: "Admin",
  team_member: "Team Member",
  sales: "Sales",
};

const ROLE_PILL: Record<WorkspaceRole, string> = {
  admin: styles.pillAdmin,
  team_member: styles.pillTeamMember,
  sales: styles.pillSales,
};

const ONLINE_WINDOW_MS = 5 * 60 * 1000;

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS;
}

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
  canInvite: boolean;
  canManageTeam: boolean;
};

export function TeamList({ members, invitations, workspaceId, currentUserId, canInvite, canManageTeam }: TeamListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceMemberWithEmail | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [optimisticMembers, setOptimisticMembers] = useState<WorkspaceMemberWithEmail[]>(members);

  // After router.refresh() the server prop changes; re-sync optimistic state.
  useEffect(() => {
    setOptimisticMembers(members);
  }, [members]);

  async function handleRoleChange(memberId: string, newRole: WorkspaceRole) {
    setPendingMemberId(memberId);
    setOptimisticMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));

    const supabase = createClient();
    const { error } = await supabase
      .from("workspace_members")
      .update({ role: newRole })
      .eq("id", memberId);

    setPendingMemberId(null);
    if (error) {
      toast("Failed to update role");
      setOptimisticMembers(members);
      return;
    }
    toast("Role updated");
    router.refresh();
  }

  async function handleSuspendToggle(memberId: string, currentStatus: WorkspaceMemberStatus) {
    const nextStatus: WorkspaceMemberStatus = currentStatus === "active" ? "suspended" : "active";
    setPendingMemberId(memberId);
    setOptimisticMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, status: nextStatus } : m)),
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("workspace_members")
      .update({ status: nextStatus })
      .eq("id", memberId);

    setPendingMemberId(null);
    if (error) {
      toast("Failed to update status");
      setOptimisticMembers(members);
      return;
    }
    toast(nextStatus === "suspended" ? "Member suspended" : "Member reactivated");
    router.refresh();
  }

  async function handleDelete(memberId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      toast("Failed to remove member");
      return;
    }
    setDeleteTarget(null);
    toast("Member removed");
    router.refresh();
  }

  async function handleRevoke(invitationId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("invitations")
      .delete()
      .eq("id", invitationId);

    if (error) {
      toast("Failed to revoke invitation");
      return;
    }
    toast("Invitation revoked");
    router.refresh();
  }

  function copyInviteLink(token: string) {
    const link = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  const pendingInvitations = invitations.filter((inv) => !inv.accepted_at);
  const displayMembers = optimisticMembers;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Team</h2>
          {canInvite && (
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
            Current Members ({displayMembers.length})
          </h3>
          {displayMembers.length === 0 ? (
            <div className={styles.empty}>No members found.</div>
          ) : (
            <div className={styles.list}>
              {displayMembers.map((member) => {
                const isSelf = member.user_id === currentUserId;
                const online = isOnline(member.last_seen);
                const suspended = member.status === "suspended";
                const isPending = pendingMemberId === member.id;
                return (
                  <div
                    key={member.id}
                    className={`${styles.memberRow} ${suspended ? styles.memberRowSuspended : ""}`}
                  >
                    <div className={styles.avatarWrap}>
                      <div className={styles.avatar}>
                        {getInitials(member.full_name, member.email)}
                      </div>
                      <span
                        className={`${styles.presenceDot} ${online ? styles.presenceOnline : styles.presenceOffline}`}
                        aria-label={online ? "Online" : "Offline"}
                        title={online ? "Online now" : member.last_seen ? `Last seen ${formatDate(member.last_seen)}` : "Never seen"}
                      />
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

                      {suspended && (
                        <span className={`pill ${styles.statusSuspended}`}>SUSPENDED</span>
                      )}

                      {canManageTeam && !isSelf ? (
                        <select
                          className={styles.roleSelect}
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as WorkspaceRole)}
                          disabled={isPending}
                        >
                          <option value="admin">Admin</option>
                          <option value="team_member">Team Member</option>
                          <option value="sales">Sales</option>
                        </select>
                      ) : (
                        <span className={`pill ${ROLE_PILL[member.role]}`}>
                          {ROLE_LABELS[member.role]}
                        </span>
                      )}

                      {canManageTeam && !isSelf && (
                        <>
                          <button
                            className={`${styles.iconButton} ${suspended ? styles.iconButtonRestore : styles.iconButtonSuspend}`}
                            onClick={() => handleSuspendToggle(member.id, member.status)}
                            disabled={isPending}
                            aria-label={suspended ? "Unsuspend member" : "Suspend member"}
                            title={suspended ? "Unsuspend" : "Suspend"}
                          >
                            {suspended ? <ShieldCheck size={16} /> : <Ban size={16} />}
                          </button>
                          <button
                            className={`${styles.iconButton} ${styles.iconButtonDelete}`}
                            onClick={() => setDeleteTarget(member)}
                            disabled={isPending}
                            aria-label={`Remove ${member.full_name || member.email}`}
                            title="Remove from workspace"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canInvite && (
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

      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmTitle}>Remove {deleteTarget.full_name || deleteTarget.email}?</p>
            <p className={styles.confirmText}>
              Are you sure? This cannot be undone. They will lose all access to this workspace.
            </p>
            <div className={styles.confirmActions}>
              <button className="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className={styles.dangerButton} onClick={() => handleDelete(deleteTarget.id)}>
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

