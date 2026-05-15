"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, FileText, ImagePlus } from "lucide-react";
import Link from "next/link";
import { pdf } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import type { Client } from "@/lib/types";
import { SUPPORTED_CURRENCIES, getCurrencySymbol, formatCurrencyPrecise } from "@/lib/currency";
import { InvoiceDocument } from "./invoice-document";
import styles from "./invoice-generator.module.css";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  vatPercent: number;
};

type InvoiceGeneratorFormProps = {
  workspaceId: string;
  workspaceName: string;
  clients: Pick<Client, "id" | "name" | "contact_name" | "contact_email">[];
  nextInvoiceNumber: string;
  defaultCurrency: string;
};

const CURRENCY_OPTIONS = SUPPORTED_CURRENCIES.map((code) => ({
  value: code,
  label: `${code} (${getCurrencySymbol(code)})`,
}));

const DUE_DATE_OPTIONS = [
  { value: "7", label: "Net 7" },
  { value: "14", label: "Net 14" },
  { value: "30", label: "Net 30" },
  { value: "60", label: "Net 60" },
  { value: "custom", label: "Custom" },
];

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const todayStr = new Date().toISOString().split("T")[0];

export function InvoiceGeneratorForm({
  workspaceId,
  workspaceName,
  clients,
  nextInvoiceNumber,
  defaultCurrency,
}: InvoiceGeneratorFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  /* ---- Settings ---- */
  const [language] = useState("EN");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [taxLabel, setTaxLabel] = useState("VAT");

  /* ---- Logo ---- */
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  /* ---- Billed From ---- */
  const [fromName, setFromName] = useState(workspaceName);
  const [fromAddress, setFromAddress] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  /* ---- Billed To ---- */
  const [selectedClientId, setSelectedClientId] = useState("");
  const [toName, setToName] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [toEmail, setToEmail] = useState("");

  /* ---- Invoice Meta ---- */
  const [invoiceNumber, setInvoiceNumber] = useState(nextInvoiceNumber);
  const [issueDate, setIssueDate] = useState(todayStr);
  const [dueDatePreset, setDueDatePreset] = useState("14");
  const [dueDate, setDueDate] = useState(addDays(todayStr, 14));
  const [deliveryDate, setDeliveryDate] = useState("");

  /* ---- Line Items ---- */
  const [items, setItems] = useState<LineItem[]>([
    { id: generateId(), description: "", quantity: 1, unit: "pc", price: 0, vatPercent: 0 },
  ]);

  /* ---- Bottom ---- */
  const [notes, setNotes] = useState("Payment is due within the specified period. Thank you for your business.");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");

  const [isGenerating, setIsGenerating] = useState(false);

  const currencySymbol = getCurrencySymbol(currency);

  /* ---- Client selection handler ---- */
  function handleClientSelect(clientId: string) {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setToName(client.name);
      setToEmail(client.contact_email ?? "");
    } else {
      setToName("");
      setToEmail("");
    }
    setToAddress("");
  }

  /* ---- Due date preset handler ---- */
  function handleDueDatePreset(preset: string) {
    setDueDatePreset(preset);
    if (preset !== "custom") {
      setDueDate(addDays(issueDate, parseInt(preset, 10)));
    }
  }

  /* ---- Logo handler ---- */
  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setLogoUrl(url);
  }

  /* ---- Line item handlers ---- */
  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: generateId(), description: "", quantity: 1, unit: "pc", price: 0, vatPercent: 0 },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((i) => i.id !== id) : prev));
  }

  const updateItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  }, []);

  /* ---- Calculations ---- */
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    [items],
  );

  const discountAmount = useMemo(() => {
    if (discountType === "percent") return subtotal * (discountValue / 100);
    return discountValue;
  }, [subtotal, discountValue, discountType]);

  const afterDiscount = subtotal - discountAmount;

  const vatTotal = useMemo(
    () =>
      items.reduce((sum, i) => {
        const lineTotal = i.quantity * i.price;
        const lineDiscount = subtotal > 0 ? lineTotal / subtotal * discountAmount : 0;
        return sum + (lineTotal - lineDiscount) * (i.vatPercent / 100);
      }, 0),
    [items, subtotal, discountAmount],
  );

  const grandTotal = afterDiscount + vatTotal;

  /* ---- Generate PDF + save to DB ---- */
  async function handleGenerate() {
    if (!selectedClientId) {
      toast("Select a client first");
      return;
    }
    if (items.every((i) => i.price === 0)) {
      toast("Add at least one line item with a price");
      return;
    }

    setIsGenerating(true);

    try {
      const blob = await pdf(
        <InvoiceDocument
          invoiceNumber={invoiceNumber}
          issueDate={issueDate}
          dueDate={dueDate}
          deliveryDate={deliveryDate}
          fromName={fromName}
          fromAddress={fromAddress}
          fromEmail={fromEmail}
          toName={toName}
          toAddress={toAddress}
          toEmail={toEmail}
          items={items}
          subtotal={subtotal}
          discountAmount={discountAmount}
          discountType={discountType}
          discountValue={discountValue}
          taxLabel={taxLabel}
          vatTotal={vatTotal}
          grandTotal={grandTotal}
          currencySymbol={currencySymbol}
          notes={notes}
        />,
      ).toBlob();

      /* Download PDF */
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      /* Save to invoices table */
      const supabase = createClient();
      await supabase.from("invoices").insert({
        workspace_id: workspaceId,
        client_id: selectedClientId,
        invoice_number: invoiceNumber,
        amount: grandTotal,
        status: "unpaid",
        due_date: dueDate,
        notes: notes || null,
      });

      toast("Invoice generated and saved");
      router.push("/dashboard/finance");
      router.refresh();
    } catch (err) {
      toast("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div>
      <Link href="/dashboard/finance" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Finance
      </Link>

      <div className={styles.page}>
        {/* ---- Left Settings Sidebar ---- */}
        <aside className={styles.sidebar}>
          <div className={styles.settingsCard}>
            <span className={styles.settingsTitle}>Settings</span>

            <div className={styles.settingGroup}>
              <label className={styles.settingLabel} htmlFor="set-lang">Language</label>
              <select id="set-lang" className={styles.settingSelect} value={language} disabled>
                <option value="EN">English</option>
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label className={styles.settingLabel} htmlFor="set-currency">Currency</label>
              <select
                id="set-currency"
                className={styles.settingSelect}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className={styles.settingGroup}>
              <label className={styles.settingLabel} htmlFor="set-tax">Tax label</label>
              <input
                id="set-tax"
                className={styles.settingInput}
                type="text"
                value={taxLabel}
                onChange={(e) => setTaxLabel(e.target.value)}
              />
            </div>
          </div>
        </aside>

        {/* ---- Main Invoice Form ---- */}
        <main className={styles.main}>
          <div className={styles.invoiceCard}>
            {/* Header: Logo + Title */}
            <div className={styles.invoiceHeader}>
              <div
                className={styles.logoUpload}
                onClick={() => logoInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") logoInputRef.current?.click(); }}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className={styles.logoPreview} />
                ) : (
                  <span className={styles.logoPlaceholder}>
                    <ImagePlus size={20} />
                    Add logo
                  </span>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  style={{ display: "none" }}
                />
              </div>
              <h1 className={styles.invoiceTitle}>INVOICE</h1>
            </div>

            {/* Billing: From + To */}
            <div className={styles.billingRow}>
              <div className={styles.billingSection}>
                <span className={styles.billLabel}>Billed From</span>
                <input
                  className={styles.billInput}
                  type="text"
                  placeholder="Agency name"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                />
                <input
                  className={styles.billInput}
                  type="text"
                  placeholder="Address"
                  value={fromAddress}
                  onChange={(e) => setFromAddress(e.target.value)}
                />
                <input
                  className={styles.billInput}
                  type="email"
                  placeholder="Email"
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                />
              </div>

              <div className={styles.billingSection}>
                <span className={styles.billLabel}>Billed To</span>
                <select
                  className={styles.billSelect}
                  value={selectedClientId}
                  onChange={(e) => handleClientSelect(e.target.value)}
                >
                  <option value="">Select client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <input
                  className={styles.billInput}
                  type="text"
                  placeholder="Client name"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                />
                <input
                  className={styles.billInput}
                  type="text"
                  placeholder="Address"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                />
                <input
                  className={styles.billInput}
                  type="email"
                  placeholder="Email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Meta: Invoice #, Dates */}
            <div className={styles.metaRow}>
              <div className={styles.metaGroup}>
                <label className={styles.metaLabel} htmlFor="inv-num">Invoice #</label>
                <input
                  id="inv-num"
                  className={styles.metaInput}
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className={styles.metaGroup}>
                <label className={styles.metaLabel} htmlFor="inv-issue">Issue Date</label>
                <input
                  id="inv-issue"
                  className={styles.metaInput}
                  type="date"
                  value={issueDate}
                  onChange={(e) => {
                    setIssueDate(e.target.value);
                    if (dueDatePreset !== "custom") {
                      setDueDate(addDays(e.target.value, parseInt(dueDatePreset, 10)));
                    }
                  }}
                />
              </div>
              <div className={styles.metaGroup}>
                <label className={styles.metaLabel} htmlFor="inv-due">Due Date</label>
                <select
                  className={styles.metaSelect}
                  value={dueDatePreset}
                  onChange={(e) => handleDueDatePreset(e.target.value)}
                  style={{ marginBottom: "var(--space-1)" }}
                >
                  {DUE_DATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {dueDatePreset === "custom" && (
                  <input
                    id="inv-due"
                    className={styles.metaInput}
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                )}
                {dueDatePreset !== "custom" && (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                    {dueDate}
                  </span>
                )}
              </div>
              <div className={styles.metaGroup}>
                <label className={styles.metaLabel} htmlFor="inv-delivery">Delivery Date</label>
                <input
                  id="inv-delivery"
                  className={styles.metaInput}
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items — Desktop Grid */}
            <div className={styles.itemsGrid}>
              <div className={styles.itemsHeader}>
                <span className={styles.itemColHeader}>Item Description</span>
                <span className={styles.itemColHeaderRight}>Qty</span>
                <span className={styles.itemColHeaderRight}>Unit</span>
                <span className={styles.itemColHeaderRight}>Price</span>
                <span className={styles.itemColHeaderRight}>{taxLabel} %</span>
                <span className={styles.itemColHeaderRight}>Total</span>
                <span></span>
              </div>
              {items.map((item) => {
                const lineTotal = item.quantity * item.price;
                return (
                  <div key={item.id} className={styles.itemRow}>
                    <input
                      className={styles.itemInput}
                      type="text"
                      placeholder="Service description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    />
                    <input
                      className={styles.itemInputRight}
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                    />
                    <input
                      className={styles.itemInputRight}
                      type="text"
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                    />
                    <input
                      className={styles.itemInputRight}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price || ""}
                      onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                    />
                    <input
                      className={styles.itemInputRight}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={item.vatPercent || ""}
                      onChange={(e) => updateItem(item.id, "vatPercent", parseFloat(e.target.value) || 0)}
                    />
                    <span className={styles.itemTotal}>
                      {formatCurrencyPrecise(lineTotal, currency)}
                    </span>
                    <button
                      type="button"
                      className={styles.deleteRowBtn}
                      onClick={() => removeItem(item.id)}
                      title="Remove item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Line Items — Mobile Cards */}
            <div className={styles.mobileItemsWrap}>
              {items.map((item, idx) => {
                const lineTotal = item.quantity * item.price;
                return (
                  <div key={item.id} className={styles.mobileItemCard}>
                    <div className={styles.mobileItemCardHeader}>
                      <span className={styles.mobileItemCardNum}>Item {idx + 1}</span>
                      <button
                        type="button"
                        className={styles.deleteRowBtn}
                        onClick={() => removeItem(item.id)}
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className={styles.mobileFieldFull}>
                      <span className={styles.mobileFieldLabel}>Description</span>
                      <input
                        className={styles.itemInput}
                        type="text"
                        placeholder="Service description"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                      />
                    </div>
                    <div className={styles.mobileFieldRow}>
                      <div className={styles.mobileField}>
                        <span className={styles.mobileFieldLabel}>Qty</span>
                        <input
                          className={styles.itemInputRight}
                          type="number"
                          min="0"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className={styles.mobileField}>
                        <span className={styles.mobileFieldLabel}>Unit</span>
                        <input
                          className={styles.itemInputRight}
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                        />
                      </div>
                      <div className={styles.mobileField}>
                        <span className={styles.mobileFieldLabel}>Price</span>
                        <input
                          className={styles.itemInputRight}
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price || ""}
                          onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className={styles.mobileField}>
                        <span className={styles.mobileFieldLabel}>{taxLabel} %</span>
                        <input
                          className={styles.itemInputRight}
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={item.vatPercent || ""}
                          onChange={(e) => updateItem(item.id, "vatPercent", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className={styles.mobileItemTotal}>
                      {formatCurrencyPrecise(lineTotal, currency)}
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" className={styles.addItemBtn} onClick={addItem}>
              <Plus size={16} /> Add Item
            </button>

            {/* Bottom: Notes + Totals */}
            <div className={styles.bottomRow}>
              <div>
                <label className={styles.metaLabel} htmlFor="inv-notes" style={{ marginBottom: "var(--space-2)", display: "block" }}>
                  Notes / Payment Terms
                </label>
                <textarea
                  id="inv-notes"
                  className={styles.notesArea}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, bank details, thank you message..."
                />
              </div>

              <div className={styles.totalsCard}>
                <div className={styles.totalRow}>
                  <span>Subtotal</span>
                  <span>{formatCurrencyPrecise(subtotal, currency)}</span>
                </div>

                <div className={styles.discountRow}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", flex: 1 }}>
                    Discount
                  </span>
                  <input
                    className={styles.discountInput}
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue || ""}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  />
                  <button
                    type="button"
                    className={styles.discountToggle}
                    onClick={() => setDiscountType((t) => (t === "percent" ? "fixed" : "percent"))}
                    title="Toggle discount type"
                  >
                    {discountType === "percent" ? "%" : currencySymbol}
                  </button>
                </div>

                {discountAmount > 0 && (
                  <div className={styles.totalRow}>
                    <span>Discount</span>
                    <span style={{ color: "var(--color-danger)" }}>
                      -{formatCurrencyPrecise(discountAmount, currency)}
                    </span>
                  </div>
                )}

                {vatTotal > 0 && (
                  <div className={styles.totalRow}>
                    <span>{taxLabel}</span>
                    <span>{formatCurrencyPrecise(vatTotal, currency)}</span>
                  </div>
                )}

                <div className={styles.totalRowGrand}>
                  <span>Total</span>
                  <span>{formatCurrencyPrecise(grandTotal, currency)}</span>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              className={`primary ${styles.generateBtn}`}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <FileText size={18} />
                {isGenerating ? "Generating..." : "Generate Document"}
              </span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
