"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import type { Client } from "@/lib/types";
import modalStyles from "../clients/clients.module.css";

type RevenueModalProps = {
  workspaceId: string;
  clients: Pick<Client, "id" | "name">[];
  onClose: () => void;
};

export function RevenueModal({ workspaceId, clients, onClose }: RevenueModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
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

    const { error: insertError } = await supabase.from("revenue_entries").insert({
      workspace_id: workspaceId,
      client_id: clientId,
      amount: parsedAmount,
      description: description || null,
      date: entryDate,
    });

    if (insertError) {
      setError(insertError.message);
      setIsLoading(false);
      return;
    }

    toast("Revenue added");
    router.refresh();
    onClose();
  }

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <h3 className={modalStyles.modalTitle}>Add Revenue</h3>
          <button type="button" className={modalStyles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && <p className={modalStyles.error}>{error}</p>}

        <form className={modalStyles.form} onSubmit={handleSubmit}>
          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="rev-client">Client *</label>
            <select
              id="rev-client"
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

          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="rev-amount">Amount (USD) *</label>
            <input
              id="rev-amount"
              className={modalStyles.input}
              type="number"
              step="0.01"
              min="0.01"
              placeholder="5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="rev-desc">Description</label>
            <input
              id="rev-desc"
              className={modalStyles.input}
              type="text"
              placeholder="Monthly retainer — May 2026"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={modalStyles.inputGroup}>
            <label className={modalStyles.label} htmlFor="rev-date">Date *</label>
            <input
              id="rev-date"
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
              {isLoading ? "Adding..." : "Add Revenue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
