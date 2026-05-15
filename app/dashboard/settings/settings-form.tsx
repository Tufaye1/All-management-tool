"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currency";
import type { WorkspaceRole } from "@/lib/types";
import styles from "./settings.module.css";

type SettingsFormProps = {
  workspaceId: string;
  workspaceName: string;
  currency: string;
  ownerId: string;
  role: WorkspaceRole;
  userId: string;
  userEmail: string;
  fullName: string;
  avatarUrl: string;
};

type Tab = "workspace" | "profile" | "security" | "danger";

const TABS: { key: Tab; label: string }[] = [
  { key: "workspace", label: "Workspace" },
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "danger", label: "Danger Zone" },
];

const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((code) => ({
  value: code,
  label: `${code} (${getCurrencySymbol(code)})`,
}));

export function SettingsForm({
  workspaceId,
  workspaceName,
  currency,
  ownerId,
  role,
  userId,
  userEmail,
  fullName,
  avatarUrl,
}: SettingsFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isAdmin = role === "admin";
  const isOwner = userId === ownerId;

  const [activeTab, setActiveTab] = useState<Tab>("workspace");

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.tab} ${activeTab === key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "workspace" && (
        <WorkspaceTab
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          currency={currency}
          isAdmin={isAdmin}
        />
      )}
      {activeTab === "profile" && (
        <ProfileTab
          userId={userId}
          userEmail={userEmail}
          fullName={fullName}
          avatarUrl={avatarUrl}
        />
      )}
      {activeTab === "security" && <SecurityTab />}
      {activeTab === "danger" && (
        <DangerTab isOwner={isOwner} />
      )}
    </div>
  );
}

/* ================================================================
   WORKSPACE TAB
   ================================================================ */

function WorkspaceTab({ workspaceId, workspaceName, currency, isAdmin }: {
  workspaceId: string; workspaceName: string; currency: string; isAdmin: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(workspaceName);
  const [currencyCode, setCurrencyCode] = useState(currency);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("workspaces")
        .update({ name, currency: currencyCode })
        .eq("id", workspaceId);

      if (error) {
        toast("Failed to save settings");
        return;
      }
      toast("Workspace settings saved");
      router.refresh();
    } catch {
      toast("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Workspace</h2>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ws-name">Workspace Name</label>
        {isAdmin ? (
          <input
            id="ws-name"
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <span className={styles.readOnly}>{workspaceName}</span>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Workspace ID</label>
        <span className={styles.readOnly} style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
          {workspaceId}
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ws-currency">Currency</label>
        {isAdmin ? (
          <>
            <select
              id="ws-currency"
              className={styles.select}
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
            >
              {CURRENCY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <span className={styles.hint}>Used across finance dashboards and invoices.</span>
          </>
        ) : (
          <span className={styles.readOnly}>{currencyCode} ({getCurrencySymbol(currencyCode)})</span>
        )}
      </div>

      {isAdmin && (
        <button className={`primary ${styles.saveBtn}`} onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      )}

      {!isAdmin && (
        <span className={styles.hint}>Only admins can edit workspace settings.</span>
      )}
    </div>
  );
}

/* ================================================================
   PROFILE TAB
   ================================================================ */

function ProfileTab({ userId, userEmail, fullName, avatarUrl }: {
  userId: string; userEmail: string; fullName: string; avatarUrl: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(fullName);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name.trim() || null, avatar_url: avatar.trim() || null })
        .eq("id", userId);

      if (error) {
        toast("Failed to update profile");
        return;
      }
      toast("Profile updated");
      router.refresh();
    } catch {
      toast("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Profile</h2>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="pf-name">Full Name</label>
        <input
          id="pf-name"
          className={styles.input}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Email</label>
        <span className={styles.readOnly}>{userEmail}</span>
        <span className={styles.hint}>Email cannot be changed here.</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="pf-avatar">Avatar URL</label>
        <input
          id="pf-avatar"
          className={styles.input}
          type="url"
          value={avatar}
          onChange={(e) => setAvatar(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          style={{ maxWidth: "100%" }}
        />
        <span className={styles.hint}>Paste a URL to your profile photo.</span>
      </div>

      <button className={`primary ${styles.saveBtn}`} onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
}

/* ================================================================
   SECURITY TAB
   ================================================================ */

function SecurityTab() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  async function handleUpdate() {
    if (!hasMinLength) {
      toast("Password must be at least 8 characters");
      return;
    }
    if (!passwordsMatch) {
      toast("Passwords do not match");
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast(error.message || "Failed to update password");
        return;
      }

      toast("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast("Failed to update password");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Security</h2>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="sec-current">Current Password</label>
        <input
          id="sec-current"
          className={styles.input}
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="sec-new">New Password</label>
        <input
          id="sec-new"
          className={styles.input}
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
        <div className={styles.requirements}>
          <span className={`${styles.requirement} ${hasMinLength ? styles.requirementMet : ""}`}>
            {hasMinLength ? <Check size={12} /> : <X size={12} />} At least 8 characters
          </span>
          <span className={`${styles.requirement} ${hasUppercase ? styles.requirementMet : ""}`}>
            {hasUppercase ? <Check size={12} /> : <X size={12} />} One uppercase letter
          </span>
          <span className={`${styles.requirement} ${hasNumber ? styles.requirementMet : ""}`}>
            {hasNumber ? <Check size={12} /> : <X size={12} />} One number
          </span>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="sec-confirm">Confirm New Password</label>
        <input
          id="sec-confirm"
          className={styles.input}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
        />
        {confirmPassword && !passwordsMatch && (
          <span className={styles.hint} style={{ color: "var(--color-danger)" }}>Passwords do not match</span>
        )}
      </div>

      <button className={`primary ${styles.saveBtn}`} onClick={handleUpdate} disabled={isSaving}>
        {isSaving ? "Updating..." : "Update Password"}
      </button>
    </div>
  );
}

/* ================================================================
   DANGER ZONE TAB
   ================================================================ */

function DangerTab({ isOwner }: { isOwner: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function handleDeleteAccount() {
    if (confirmText !== "DELETE") return;

    toast("Account deletion requires admin action in Supabase. Contact support.");
    setShowDeleteModal(false);
    setConfirmText("");
  }

  async function handleLeaveWorkspace() {
    if (confirmText !== "LEAVE") return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      toast("Failed to leave workspace");
      return;
    }

    toast("You have left the workspace");
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <div className={styles.dangerCard}>
        <h2 className={styles.cardTitle} style={{ color: "var(--color-danger)" }}>Danger Zone</h2>

        {!isOwner && (
          <div className={styles.dangerItem}>
            <div className={styles.dangerInfo}>
              <span className={styles.dangerLabel}>Leave Workspace</span>
              <span className={styles.dangerHint}>Remove yourself from this workspace. You will lose access to all data.</span>
            </div>
            <button className={styles.dangerBtn} onClick={() => setShowLeaveModal(true)}>
              Leave
            </button>
          </div>
        )}

        <div className={styles.dangerItem}>
          <div className={styles.dangerInfo}>
            <span className={styles.dangerLabel}>Delete Account</span>
            <span className={styles.dangerHint}>Permanently delete your account and all associated data. This cannot be undone.</span>
          </div>
          <button className={styles.dangerBtn} onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Account</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              This action is permanent and cannot be undone. Type <strong>DELETE</strong> to confirm.
            </p>
            <input
              className={styles.input}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              style={{ maxWidth: "100%" }}
            />
            <div className={styles.modalActions}>
              <button className="secondary" onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}>Cancel</button>
              <button
                className={styles.dangerBtn}
                onClick={handleDeleteAccount}
                disabled={confirmText !== "DELETE"}
                style={{ opacity: confirmText !== "DELETE" ? 0.5 : 1 }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Workspace Modal */}
      {showLeaveModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowLeaveModal(false); setConfirmText(""); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Leave Workspace</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              You will lose access to all workspace data. Type <strong>LEAVE</strong> to confirm.
            </p>
            <input
              className={styles.input}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type LEAVE"
              style={{ maxWidth: "100%" }}
            />
            <div className={styles.modalActions}>
              <button className="secondary" onClick={() => { setShowLeaveModal(false); setConfirmText(""); }}>Cancel</button>
              <button
                className={styles.dangerBtn}
                onClick={handleLeaveWorkspace}
                disabled={confirmText !== "LEAVE"}
                style={{ opacity: confirmText !== "LEAVE" ? 0.5 : 1 }}
              >
                Leave Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
