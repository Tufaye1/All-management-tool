"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, FolderOpen, MessageSquare, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currency";
import type { WorkspaceRole, FunctionTag, Priority } from "@/lib/types";
import styles from "./settings.module.css";

type TemplateSummary = {
  id: string;
  name: string;
  description: string | null;
  taskCount: number;
  createdAt: string;
};

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
  connectedProviders: string[];
  slackTeamName: string | null;
  templates: TemplateSummary[];
};

type Tab = "workspace" | "profile" | "security" | "templates" | "danger";

const TABS: { key: Tab; label: string; adminOnly?: boolean }[] = [
  { key: "workspace", label: "Workspace" },
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
  { key: "templates", label: "Templates", adminOnly: true },
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
  connectedProviders,
  slackTeamName,
  templates,
}: SettingsFormProps) {
  const isAdmin = role === "admin";
  const isOwner = userId === ownerId;

  const [activeTab, setActiveTab] = useState<Tab>("workspace");

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </div>

      <div className={styles.tabs}>
        {visibleTabs.map(({ key, label }) => (
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
          connectedProviders={connectedProviders}
          slackTeamName={slackTeamName}
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
      {activeTab === "templates" && isAdmin && (
        <TemplatesTab workspaceId={workspaceId} templates={templates} />
      )}
      {activeTab === "danger" && <DangerTab isOwner={isOwner} />}
    </div>
  );
}

/* ================================================================
   WORKSPACE TAB
   ================================================================ */

function WorkspaceTab({ workspaceId, workspaceName, currency, isAdmin, connectedProviders, slackTeamName }: {
  workspaceId: string; workspaceName: string; currency: string; isAdmin: boolean;
  connectedProviders: string[]; slackTeamName: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(workspaceName);
  const [currencyCode, setCurrencyCode] = useState(currency);
  const [isSaving, setIsSaving] = useState(false);

  const driveConnected = connectedProviders.includes("google_drive");
  const slackConnected = connectedProviders.includes("slack");

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

  function handleConnectDrive() {
    window.location.href = `/api/integrations/google-drive/connect?workspaceId=${workspaceId}`;
  }

  function handleConnectSlack() {
    window.location.href = `/api/integrations/slack/connect?workspaceId=${workspaceId}`;
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

      {/* Integrations */}
      <div className={styles.integrationSection}>
        <h3 className={styles.integrationTitle}>Integrations</h3>

        <div className={styles.integrationRow}>
          <div className={styles.integrationInfo}>
            <FolderOpen size={18} />
            <div>
              <span className={styles.integrationName}>Google Drive</span>
              <span className={styles.integrationDesc}>
                {driveConnected ? "Connected — folders auto-created for new projects" : "Auto-create project folders in Google Drive"}
              </span>
            </div>
          </div>
          {isAdmin && (
            driveConnected ? (
              <span className={styles.connectedBadge}>Connected</span>
            ) : (
              <button className="secondary" style={{ fontSize: "var(--text-sm)", padding: "var(--space-2) var(--space-4)" }} onClick={handleConnectDrive}>
                Connect
              </button>
            )
          )}
        </div>

        <div className={styles.integrationRow}>
          <div className={styles.integrationInfo}>
            <MessageSquare size={18} />
            <div>
              <span className={styles.integrationName}>Slack</span>
              <span className={styles.integrationDesc}>
                {slackConnected
                  ? `Connected to ${slackTeamName ?? "workspace"}`
                  : "View Slack messages inside client pages"}
              </span>
            </div>
          </div>
          {isAdmin && (
            slackConnected ? (
              <span className={styles.connectedBadge}>Connected</span>
            ) : (
              <button className="secondary" style={{ fontSize: "var(--text-sm)", padding: "var(--space-2) var(--space-4)" }} onClick={handleConnectSlack}>
                Connect
              </button>
            )
          )}
        </div>
      </div>
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
    if (!hasMinLength) { toast("Password must be at least 8 characters"); return; }
    if (!passwordsMatch) { toast("Passwords do not match"); return; }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) { toast(error.message || "Failed to update password"); return; }

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
        <input id="sec-current" className={styles.input} type="password" value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="sec-new">New Password</label>
        <input id="sec-new" className={styles.input} type="password" value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
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
        <input id="sec-confirm" className={styles.input} type="password" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
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
   TEMPLATES TAB
   ================================================================ */

const DEFAULT_TEMPLATE_TASKS: { title: string; tag: FunctionTag; priority: Priority; days: number }[] = [
  { title: "Kickoff Meeting", tag: "strategy", priority: "high", days: 0 },
  { title: "Market Research", tag: "analytics", priority: "high", days: 3 },
  { title: "Strategy Development", tag: "strategy", priority: "high", days: 7 },
  { title: "Creative Brief", tag: "content", priority: "normal", days: 10 },
  { title: "Content Calendar", tag: "content", priority: "normal", days: 14 },
  { title: "Ad Account Setup", tag: "ads", priority: "normal", days: 14 },
  { title: "Campaign Launch", tag: "marketing", priority: "urgent", days: 21 },
  { title: "Weekly Report 1", tag: "analytics", priority: "normal", days: 28 },
  { title: "Weekly Report 2", tag: "analytics", priority: "normal", days: 35 },
  { title: "Mid-Campaign Review", tag: "strategy", priority: "high", days: 35 },
  { title: "Weekly Report 3", tag: "analytics", priority: "normal", days: 42 },
  { title: "Campaign Optimization", tag: "ads", priority: "high", days: 42 },
  { title: "Weekly Report 4", tag: "analytics", priority: "normal", days: 49 },
  { title: "Final Report", tag: "analytics", priority: "high", days: 56 },
  { title: "Invoice and Offboarding", tag: "admin", priority: "normal", days: 60 },
];

function TemplatesTab({ workspaceId, templates }: { workspaceId: string; templates: TemplateSummary[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreateDefault() {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: template, error: tErr } = await supabase
        .from("project_templates")
        .insert({ workspace_id: workspaceId, name: "Education Campaign", description: "Standard 2-month education marketing campaign with 15 tasks" })
        .select("id")
        .single();

      if (tErr || !template) { toast("Failed to create template"); return; }

      const tasks = DEFAULT_TEMPLATE_TASKS.map((t, i) => ({
        template_id: template.id,
        title: t.title,
        function_tag: t.tag,
        priority: t.priority,
        due_days_from_start: t.days,
        position: i,
      }));

      const { error: taskErr } = await supabase.from("template_tasks").insert(tasks);
      if (taskErr) { toast("Template created but tasks failed"); return; }

      toast("Default template created with 15 tasks");
      router.refresh();
    } catch {
      toast("Failed to create template");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateCustom() {
    if (!newName.trim()) { toast("Template name required"); return; }
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("project_templates")
        .insert({ workspace_id: workspaceId, name: newName.trim(), description: newDesc.trim() || null });

      if (error) { toast("Failed to create template"); return; }
      toast("Template created");
      setNewName("");
      setNewDesc("");
      setIsCreating(false);
      router.refresh();
    } catch {
      toast("Failed to create template");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("project_templates").delete().eq("id", id);
    if (error) { toast("Failed to delete"); return; }
    toast("Template deleted");
    router.refresh();
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Project Templates</h2>
      <span className={styles.hint}>Templates auto-create tasks when starting a new project.</span>

      {templates.length === 0 && !isCreating && (
        <div className={styles.emptyTemplates}>
          <p>No templates yet.</p>
          <button className="primary" onClick={handleCreateDefault} disabled={isSaving} style={{ fontSize: "var(--text-sm)" }}>
            {isSaving ? "Creating..." : "Create Default Template"}
          </button>
          <span className={styles.hint}>Creates an &quot;Education Campaign&quot; template with 15 tasks.</span>
        </div>
      )}

      {templates.length > 0 && (
        <div className={styles.templateList}>
          {templates.map((t) => (
            <div key={t.id} className={styles.templateItem}>
              <div className={styles.templateInfo}>
                <span className={styles.templateName}>{t.name}</span>
                {t.description && <span className={styles.templateDesc}>{t.description}</span>}
                <span className={styles.templateMeta}>{t.taskCount} task{t.taskCount !== 1 ? "s" : ""}</span>
              </div>
              <button className={styles.templateDeleteBtn} onClick={() => handleDelete(t.id)} title="Delete template">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!isCreating && templates.length > 0 && (
        <button className="secondary" onClick={() => setIsCreating(true)} style={{ fontSize: "var(--text-sm)", alignSelf: "flex-start" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Plus size={14} /> New Template
          </span>
        </button>
      )}

      {isCreating && (
        <div className={styles.templateForm}>
          <input className={styles.input} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Template name" />
          <input className={styles.input} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" style={{ maxWidth: "100%" }} />
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <button className="primary" onClick={handleCreateCustom} disabled={isSaving} style={{ fontSize: "var(--text-sm)" }}>
              {isSaving ? "Creating..." : "Create"}
            </button>
            <button className="secondary" onClick={() => setIsCreating(false)} style={{ fontSize: "var(--text-sm)" }}>Cancel</button>
          </div>
        </div>
      )}
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

    const { error } = await supabase.from("workspace_members").delete().eq("user_id", user.id);
    if (error) { toast("Failed to leave workspace"); return; }

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
            <button className={styles.dangerBtn} onClick={() => setShowLeaveModal(true)}>Leave</button>
          </div>
        )}

        <div className={styles.dangerItem}>
          <div className={styles.dangerInfo}>
            <span className={styles.dangerLabel}>Delete Account</span>
            <span className={styles.dangerHint}>Permanently delete your account and all associated data. This cannot be undone.</span>
          </div>
          <button className={styles.dangerBtn} onClick={() => setShowDeleteModal(true)}>Delete Account</button>
        </div>
      </div>

      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Delete Account</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              This action is permanent and cannot be undone. Type <strong>DELETE</strong> to confirm.
            </p>
            <input className={styles.input} type="text" value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE" style={{ maxWidth: "100%" }} />
            <div className={styles.modalActions}>
              <button className="secondary" onClick={() => { setShowDeleteModal(false); setConfirmText(""); }}>Cancel</button>
              <button className={styles.dangerBtn} onClick={handleDeleteAccount}
                disabled={confirmText !== "DELETE"} style={{ opacity: confirmText !== "DELETE" ? 0.5 : 1 }}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {showLeaveModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowLeaveModal(false); setConfirmText(""); }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Leave Workspace</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              You will lose access to all workspace data. Type <strong>LEAVE</strong> to confirm.
            </p>
            <input className={styles.input} type="text" value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)} placeholder="Type LEAVE" style={{ maxWidth: "100%" }} />
            <div className={styles.modalActions}>
              <button className="secondary" onClick={() => { setShowLeaveModal(false); setConfirmText(""); }}>Cancel</button>
              <button className={styles.dangerBtn} onClick={handleLeaveWorkspace}
                disabled={confirmText !== "LEAVE"} style={{ opacity: confirmText !== "LEAVE" ? 0.5 : 1 }}>
                Leave Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
