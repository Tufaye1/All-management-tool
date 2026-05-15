"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import type { Client, CostCategory } from "@/lib/types";
import modalStyles from "../clients/clients.module.css";

type CostModalProps = {
  workspaceId: string;
  clients: Pick<Client, "id" | "name">[];
  onClose: () => void;
};

export function CostModal({ workspaceId, clients, onClose }: CostModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CostCategory>("ad_spend");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split("T")[0]);
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

    const parsedAmount = parseFloat(amount);
    if (!clientId) {
      setError("Client is required.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    const { error: insertError } = await supabase.from("cost_entries").insert({
      workspace_id: workspaceId,
      client_id: clientId,
      amount: parsedAmount,
      category,
      description: description || null,
      date: entryDate,
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    toast("Cost added");
    router.refresh();
    onClose();
  }

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <h3 className={modalStyles.modalTitle}>Add Cost</h3>
          <button type="button" className={modalStyles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <p className={modalStyles.error}>{error}</p>}

        <form className={modalStyles.form} onSubmit={handleSubmit}>
          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="cost-client">Client *</label>
            <select
              id="cost-client"
              className={modalStyles.select}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            <div className={modalStyles.inputGroup} style={{ flex: 1 }}>
              <label className={modalStyles.label} htmlFor="cost-amount">Amount (USD) *</label>
              <input
                id="cost-amount"
                className={modalStyles.input}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="1200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className={modalStyles.inputGroup} style={{ flex: 1 }}>
              <label className={modalStyles.label} htmlFor="cost-category">Category *</label>
              <select
                id="cost-category"
                className={modalStyles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value as CostCategory)}
                required
              >
                <option value="ad_spend">Ad Spend</option>
                <option value="freelancer">Freelancer</option>
                <option value="tools">Tools</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="cost-desc">Description</label>
            <input
              id="cost-desc"
              className={modalStyles.input}
              type="text"
              placeholder="Facebook Ads — May campaign"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="cost-date">Date *</label>
            <input
              id="cost-date"
              className={modalStyles.input}
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              required
            />
          </div>

          <div className={modalStyles.formActions}>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Cost"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
