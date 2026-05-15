"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { formatCurrency } from "@/lib/currency";
import type { Lead, LeadStatus, LeadSource, WorkspaceMemberWithEmail } from "@/lib/types";
import styles from "./leads.module.css";

/* -------- Constants -------- */

const COLUMNS: { status: LeadStatus; label: string; color: string }[] = [
  { status: "new", label: "New", color: "var(--color-text-tertiary)" },
  { status: "contacted", label: "Contacted", color: "var(--color-info)" },
  { status: "proposal", label: "Proposal", color: "var(--color-warning)" },
  { status: "negotiation", label: "Negotiation", color: "#AF52DE" },
  { status: "won", label: "Won", color: "var(--color-success)" },
  { status: "lost", label: "Lost", color: "var(--color-danger)" },
];

const SOURCE_LABELS: Record<string, string> = {
  referral: "Referral",
  website: "Website",
  social_media: "Social Media",
  cold_outreach: "Cold Outreach",
  event: "Event",
  other: "Other",
};

function getInitials(str: string) {
  return str.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* -------- Props -------- */

type LeadsBoardProps = {
  leads: Lead[];
  members: WorkspaceMemberWithEmail[];
  workspaceId: string;
  canWrite: boolean;
  currency: string;
};

export function LeadsBoard({ leads, members, workspaceId, canWrite, currency }: LeadsBoardProps) {
  const router = useRouter();
  const { toast } = useToast();

  /* ---- State ---- */
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<LeadStatus | null>(null);
  const dragCounterRef = useRef<Map<string, number>>(new Map());

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lostModal, setLostModal] = useState<Lead | null>(null);
  const [convertModal, setConvertModal] = useState<Lead | null>(null);

  /* ---- Filters ---- */
  const [filterSource, setFilterSource] = useState("");
  const [filterAssigned, setFilterAssigned] = useState("");

  const memberMap = useMemo(() => new Map(members.map((m) => [m.user_id, m])), [members]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (filterSource) result = result.filter((l) => l.source === filterSource);
    if (filterAssigned) result = result.filter((l) => l.assigned_to === filterAssigned);
    return result;
  }, [leads, filterSource, filterAssigned]);

  /* ---- Pipeline stats ---- */
  const totalLeads = filteredLeads.length;
  const pipelineValue = filteredLeads
    .filter((l) => l.status !== "won" && l.status !== "lost")
    .reduce((sum, l) => sum + (l.estimated_value ?? 0), 0);

  /* ---- Group by status ---- */
  const leadsByStatus = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>();
    for (const col of COLUMNS) map.set(col.status, []);
    for (const lead of filteredLeads) {
      const list = map.get(lead.status);
      if (list) list.push(lead);
    }
    return map;
  }, [filteredLeads]);

  /* ---- Drag & Drop ---- */
  function handleDragStart(e: React.DragEvent, leadId: string) {
    if (!canWrite) return;
    setDraggedId(leadId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", leadId);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setActiveColumn(null);
    dragCounterRef.current.clear();
  }

  function handleDragEnter(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    const counter = (dragCounterRef.current.get(status) ?? 0) + 1;
    dragCounterRef.current.set(status, counter);
    setActiveColumn(status);
  }

  function handleDragLeave(status: LeadStatus) {
    const counter = (dragCounterRef.current.get(status) ?? 0) - 1;
    dragCounterRef.current.set(status, counter);
    if (counter <= 0) {
      dragCounterRef.current.set(status, 0);
      if (activeColumn === status) setActiveColumn(null);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: React.DragEvent, newStatus: LeadStatus) {
    e.preventDefault();
    setActiveColumn(null);
    dragCounterRef.current.clear();

    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    const lead = leads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    /* Special flows for Won / Lost */
    if (newStatus === "won") {
      setConvertModal(lead);
      return;
    }
    if (newStatus === "lost") {
      setLostModal(lead);
      return;
    }

    await updateLeadStatus(leadId, newStatus);
  }

  async function updateLeadStatus(leadId: string, newStatus: LeadStatus, extra?: Record<string, unknown>) {
    const supabase = createClient();
    const updates: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString(), ...extra };

    const { error } = await supabase.from("leads").update(updates).eq("id", leadId);
    if (error) {
      toast("Failed to update lead");
      return;
    }
    router.refresh();
  }

  /* ---- Convert to Client ---- */
  async function handleConvert(lead: Lead) {
    const supabase = createClient();

    /* Mark lead as Won */
    await supabase.from("leads").update({
      status: "won",
      won_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", lead.id);

    /* Create client record */
    const { error } = await supabase.from("clients").insert({
      workspace_id: workspaceId,
      name: lead.company || lead.name,
      contact_name: lead.name,
      contact_email: lead.email,
      contact_phone: lead.phone,
      status: "active",
    });

    if (error) {
      toast("Lead marked as Won but failed to create client");
    } else {
      toast(`Client created from lead: ${lead.company || lead.name}`);
    }
    setConvertModal(null);
    router.refresh();
  }

  /* ---- Mark as Lost ---- */
  async function handleLost(lead: Lead, reason: string) {
    await updateLeadStatus(lead.id, "lost", { lost_reason: reason || null });
    setLostModal(null);
  }

  /* ---- Save panel edits ---- */
  async function handlePanelSave(leadId: string, updates: Partial<Lead>) {
    const supabase = createClient();
    const { error } = await supabase.from("leads")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", leadId);
    if (error) {
      toast("Failed to save changes");
      return;
    }
    toast("Lead updated");
    setSelectedLead(null);
    router.refresh();
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Leads</h1>
          <span className={styles.pipelineStats}>
            {totalLeads} lead{totalLeads !== 1 ? "s" : ""}
            {pipelineValue > 0 ? ` · ${formatCurrency(pipelineValue, currency)} pipeline` : ""}
          </span>
        </div>
        {canWrite && (
          <button className="primary" onClick={() => setShowAddModal(true)}>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Plus size={16} /> Add Lead
            </span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select className={styles.filterSelect} value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
          <option value="">All Sources</option>
          {Object.entries(SOURCE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select className={styles.filterSelect} value={filterAssigned} onChange={(e) => setFilterAssigned(e.target.value)}>
          <option value="">All Assignees</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <div className={styles.board}>
        {COLUMNS.map(({ status, label, color }) => {
          const columnLeads = leadsByStatus.get(status) ?? [];
          const colValue = columnLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0);
          return (
            <div key={status} className={styles.column}>
              <div className={styles.columnHeader}>
                <span className={styles.columnDot} style={{ background: color }} />
                <span className={styles.columnTitle}>{label}</span>
                <span className={styles.columnCount}>{columnLeads.length}</span>
                {colValue > 0 && (
                  <span className={styles.columnValue}>{formatCurrency(colValue, currency)}</span>
                )}
              </div>
              <div
                className={`${styles.dropZone} ${activeColumn === status ? styles.dropZoneActive : ""}`}
                onDragEnter={(e) => handleDragEnter(e, status)}
                onDragLeave={() => handleDragLeave(status)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
              >
                {columnLeads.length === 0 ? (
                  <div className={styles.emptyColumn}>No leads</div>
                ) : (
                  columnLeads.map((lead) => {
                    const assignee = lead.assigned_to ? memberMap.get(lead.assigned_to) : null;
                    return (
                      <div
                        key={lead.id}
                        className={`${styles.card} ${draggedId === lead.id ? styles.cardDragging : ""}`}
                        draggable={canWrite}
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedLead(lead)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") setSelectedLead(lead); }}
                      >
                        <span className={styles.cardCompany}>{lead.company || lead.name}</span>
                        {lead.company && <span className={styles.cardName}>{lead.name}</span>}
                        {(lead.estimated_value ?? 0) > 0 && (
                          <span className={styles.cardValue}>{formatCurrency(lead.estimated_value!, currency)}</span>
                        )}
                        <div className={styles.cardBottom}>
                          {lead.source && (
                            <span className="pill pill-info" style={{ fontSize: "9px", padding: "1px 6px" }}>
                              {SOURCE_LABELS[lead.source] ?? lead.source}
                            </span>
                          )}
                          {assignee && (
                            <span className={styles.cardAvatar} title={assignee.full_name || assignee.email}>
                              {getInitials(assignee.full_name || assignee.email)}
                            </span>
                          )}
                          {lead.won_date && <span className={styles.convertedBadge}>Converted</span>}
                          <span className={styles.cardDate}>{formatDate(lead.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          members={members}
          memberMap={memberMap}
          currency={currency}
          canWrite={canWrite}
          onClose={() => setSelectedLead(null)}
          onSave={handlePanelSave}
          onConvert={(l) => { setSelectedLead(null); setConvertModal(l); }}
          onMarkLost={(l) => { setSelectedLead(null); setLostModal(l); }}
        />
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <AddLeadModal
          workspaceId={workspaceId}
          members={members}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); router.refresh(); }}
        />
      )}

      {/* Convert to Client Modal */}
      {convertModal && (
        <ConvertModal
          lead={convertModal}
          onConfirm={() => handleConvert(convertModal)}
          onClose={() => setConvertModal(null)}
        />
      )}

      {/* Lost Reason Modal */}
      {lostModal && (
        <LostReasonModal
          lead={lostModal}
          onConfirm={(reason) => handleLost(lostModal, reason)}
          onClose={() => setLostModal(null)}
        />
      )}
    </div>
  );
}

/* ================================================================
   LEAD DETAIL PANEL
   ================================================================ */

type LeadDetailPanelProps = {
  lead: Lead;
  members: WorkspaceMemberWithEmail[];
  memberMap: Map<string, WorkspaceMemberWithEmail>;
  currency: string;
  canWrite: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Lead>) => void;
  onConvert: (lead: Lead) => void;
  onMarkLost: (lead: Lead) => void;
};

function LeadDetailPanel({ lead, members, currency, canWrite, onClose, onSave, onConvert, onMarkLost }: LeadDetailPanelProps) {
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email ?? "");
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [company, setCompany] = useState(lead.company ?? "");
  const [source, setSource] = useState(lead.source ?? "");
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to ?? "");
  const [estimatedValue, setEstimatedValue] = useState(lead.estimated_value?.toString() ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");

  function handleSave() {
    onSave(lead.id, {
      name,
      email: email || null,
      phone: phone || null,
      company: company || null,
      source: (source || null) as Lead["source"],
      assigned_to: assignedTo || null,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
      notes: notes || null,
    });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>{lead.company || lead.name}</span>
          <button className={styles.closeButton} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.panelBody}>
          <div className={styles.fieldsGrid}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Contact Name</span>
              <input className={styles.fieldInput} value={name} onChange={(e) => setName(e.target.value)} disabled={!canWrite} />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Email</span>
              <input className={styles.fieldInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!canWrite} />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Phone</span>
              <input className={styles.fieldInput} value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!canWrite} />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Company</span>
              <input className={styles.fieldInput} value={company} onChange={(e) => setCompany(e.target.value)} disabled={!canWrite} />
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Source</span>
              <select className={styles.fieldSelect} value={source} onChange={(e) => setSource(e.target.value)} disabled={!canWrite}>
                <option value="">None</option>
                {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Assigned To</span>
              <select className={styles.fieldSelect} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} disabled={!canWrite}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Est. Value</span>
              <input
                className={styles.fieldInput}
                type="number"
                min="0"
                step="0.01"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                disabled={!canWrite}
              />
            </div>
          </div>

          {/* Notes */}
          <div className={styles.notesSection}>
            <span className={styles.notesTitle}>Notes</span>
            <textarea
              className={styles.notesInput}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this lead..."
              disabled={!canWrite}
            />
          </div>

          {/* Actions */}
          {canWrite && (
            <div className={styles.panelActions}>
              <button className="primary" onClick={handleSave} style={{ fontSize: "var(--text-sm)", padding: "var(--space-2) var(--space-4)" }}>
                Save Changes
              </button>
              {lead.status === "won" && !lead.won_date && (
                <button className={styles.successBtn} onClick={() => onConvert(lead)}>Convert to Client</button>
              )}
              {lead.status === "won" && lead.won_date && (
                <span className={styles.convertedBadge} style={{ alignSelf: "center" }}>Converted</span>
              )}
              {lead.status !== "lost" && lead.status !== "won" && (
                <button className={styles.dangerBtn} onClick={() => onMarkLost(lead)}>Mark as Lost</button>
              )}
              {lead.status === "won" && !lead.won_date && (
                <button className={styles.successBtn} onClick={() => onConvert(lead)}>Convert to Client</button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   ADD LEAD MODAL
   ================================================================ */

type AddLeadModalProps = {
  workspaceId: string;
  members: WorkspaceMemberWithEmail[];
  onClose: () => void;
  onSuccess: () => void;
};

function AddLeadModal({ workspaceId, members, onClose, onSuccess }: AddLeadModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      toast("Contact name is required");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("leads").insert({
        workspace_id: workspaceId,
        name: name.trim(),
        company: company.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        source: source || null,
        estimated_value: estimatedValue ? parseFloat(estimatedValue) : null,
        assigned_to: assignedTo || null,
        notes: notes.trim() || null,
      });

      if (error) {
        toast("Failed to create lead");
        return;
      }
      toast("Lead created");
      onSuccess();
    } catch {
      toast("Failed to create lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add Lead</h2>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={18} /></button>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Company</label>
            <input className={styles.formInput} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contact Name *</label>
            <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input className={styles.formInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone</label>
            <input className={styles.formInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Source</label>
            <select className={styles.formSelect} value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">Select source</option>
              {Object.entries(SOURCE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Estimated Value</label>
            <input className={styles.formInput} type="number" min="0" step="0.01" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} placeholder="0.00" />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Assign To</label>
          <select className={styles.formSelect} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.full_name || m.email}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Notes</label>
          <textarea className={styles.formTextarea} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Initial notes about this lead..." />
        </div>

        <div className={styles.modalActions}>
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? "Creating..." : "Add Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   CONVERT TO CLIENT MODAL
   ================================================================ */

type ConvertModalProps = {
  lead: Lead;
  onConfirm: () => void;
  onClose: () => void;
};

function ConvertModal({ lead, onConfirm, onClose }: ConvertModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Convert to Client?</h2>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          This will mark <strong>{lead.company || lead.name}</strong> as Won and create a new client record with:
        </p>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)", background: "var(--color-bg-muted)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)" }}>
          <div>Name: {lead.company || lead.name}</div>
          {lead.email && <div>Email: {lead.email}</div>}
          {lead.phone && <div>Phone: {lead.phone}</div>}
        </div>
        <div className={styles.modalActions}>
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" onClick={onConfirm}>Convert</button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   LOST REASON MODAL
   ================================================================ */

type LostReasonModalProps = {
  lead: Lead;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

function LostReasonModal({ lead, onConfirm, onClose }: LostReasonModalProps) {
  const [reason, setReason] = useState("");

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Mark as Lost</h2>
          <button className={styles.modalCloseBtn} onClick={onClose}><X size={18} /></button>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          Why was <strong>{lead.company || lead.name}</strong> lost?
        </p>
        <div className={styles.formGroup}>
          <textarea
            className={styles.formTextarea}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Budget constraints, chose competitor, timing..."
            style={{ minHeight: 60 }}
          />
        </div>
        <div className={styles.modalActions}>
          <button className="secondary" onClick={onClose}>Cancel</button>
          <button
            className="primary"
            style={{ background: "var(--color-danger)" }}
            onClick={() => onConfirm(reason)}
          >
            Mark as Lost
          </button>
        </div>
      </div>
    </div>
  );
}
