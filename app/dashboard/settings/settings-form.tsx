"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currency";
import styles from "./settings.module.css";

type SettingsFormProps = {
  workspaceId: string;
  workspaceName: string;
  currency: string;
};

const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((code) => ({
  value: code,
  label: `${code} (${getCurrencySymbol(code)})`,
}));

export function SettingsForm({ workspaceId, workspaceName, currency }: SettingsFormProps) {
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

      toast("Settings saved");
      router.refresh();
    } catch {
      toast("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Workspace</h2>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ws-name">Workspace Name</label>
          <input
            id="ws-name"
            className={styles.input}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="ws-currency">Currency</label>
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
          <span className={styles.hint}>
            Used across finance dashboards and invoices.
          </span>
        </div>

        <button
          className={`primary ${styles.saveBtn}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
