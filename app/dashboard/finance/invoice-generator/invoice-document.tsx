"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type LineItem = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  price: number;
  vatPercent: number;
};

type InvoiceDocumentProps = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  deliveryDate: string;
  fromName: string;
  fromAddress: string;
  fromEmail: string;
  toName: string;
  toAddress: string;
  toEmail: string;
  items: LineItem[];
  subtotal: number;
  discountAmount: number;
  discountType: "percent" | "fixed";
  discountValue: number;
  taxLabel: string;
  vatTotal: number;
  grandTotal: number;
  currencySymbol: string;
  notes: string;
};

const s = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1D1D1F",
    backgroundColor: "#FFFFFF",
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: "#007AFF",
    letterSpacing: 2,
  },
  invoiceNum: {
    fontSize: 10,
    color: "#6E6E73",
    marginTop: 4,
    textAlign: "right",
  },

  /* Divider */
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    marginBottom: 20,
  },

  /* Billing columns */
  billingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  billingCol: {
    width: "48%",
  },
  billLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  billValue: {
    fontSize: 10,
    color: "#1D1D1F",
    lineHeight: 1.6,
  },

  /* Meta row */
  metaRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 24,
  },
  metaBlock: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 10,
    color: "#1D1D1F",
  },

  /* Items table */
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#1D1D1F",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  colDesc: { width: "38%", paddingRight: 8 },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "10%", textAlign: "right" },
  colPrice: { width: "14%", textAlign: "right" },
  colVat: { width: "12%", textAlign: "right" },
  colTotal: { width: "16%", textAlign: "right" },
  thText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tdText: {
    fontSize: 10,
    color: "#1D1D1F",
  },
  tdTextRight: {
    fontSize: 10,
    color: "#1D1D1F",
    textAlign: "right",
  },

  /* Totals */
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  notesBlock: {
    width: "50%",
    paddingRight: 20,
  },
  notesLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: "#6E6E73",
    lineHeight: 1.6,
  },
  totalsBlock: {
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "#6E6E73",
  },
  totalValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1D1D1F",
    textAlign: "right",
  },
  grandDivider: {
    borderTopWidth: 2,
    borderTopColor: "#1D1D1F",
    marginTop: 8,
    paddingTop: 8,
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grandLabel: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#1D1D1F",
  },
  grandValue: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#007AFF",
    textAlign: "right",
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: "#8E8E93",
    textAlign: "center",
  },
});

function fmt(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function InvoiceDocument({
  invoiceNumber,
  issueDate,
  dueDate,
  deliveryDate,
  fromName,
  fromAddress,
  fromEmail,
  toName,
  toAddress,
  toEmail,
  items,
  subtotal,
  discountAmount,
  discountType,
  discountValue,
  taxLabel,
  vatTotal,
  grandTotal,
  currencySymbol,
  notes,
}: InvoiceDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={{ fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1D1D1F" }}>
              {fromName}
            </Text>
            {fromAddress ? <Text style={{ fontSize: 9, color: "#6E6E73", marginTop: 2 }}>{fromAddress}</Text> : null}
            {fromEmail ? <Text style={{ fontSize: 9, color: "#6E6E73", marginTop: 1 }}>{fromEmail}</Text> : null}
          </View>
          <View>
            <Text style={s.title}>INVOICE</Text>
            <Text style={s.invoiceNum}>{invoiceNumber}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Billing */}
        <View style={s.billingRow}>
          <View style={s.billingCol}>
            <Text style={s.billLabel}>Billed From</Text>
            <Text style={s.billValue}>{fromName}</Text>
            {fromAddress ? <Text style={s.billValue}>{fromAddress}</Text> : null}
            {fromEmail ? <Text style={s.billValue}>{fromEmail}</Text> : null}
          </View>
          <View style={s.billingCol}>
            <Text style={s.billLabel}>Billed To</Text>
            <Text style={s.billValue}>{toName}</Text>
            {toAddress ? <Text style={s.billValue}>{toAddress}</Text> : null}
            {toEmail ? <Text style={s.billValue}>{toEmail}</Text> : null}
          </View>
        </View>

        {/* Meta */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Issue Date</Text>
            <Text style={s.metaValue}>{fmtDate(issueDate)}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Due Date</Text>
            <Text style={s.metaValue}>{fmtDate(dueDate)}</Text>
          </View>
          {deliveryDate ? (
            <View style={s.metaBlock}>
              <Text style={s.metaLabel}>Delivery Date</Text>
              <Text style={s.metaValue}>{fmtDate(deliveryDate)}</Text>
            </View>
          ) : null}
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Invoice Number</Text>
            <Text style={s.metaValue}>{invoiceNumber}</Text>
          </View>
        </View>

        {/* Items Table Header */}
        <View style={s.tableHeader}>
          <View style={s.colDesc}><Text style={s.thText}>Description</Text></View>
          <View style={s.colQty}><Text style={{ ...s.thText, textAlign: "right" }}>Qty</Text></View>
          <View style={s.colUnit}><Text style={{ ...s.thText, textAlign: "right" }}>Unit</Text></View>
          <View style={s.colPrice}><Text style={{ ...s.thText, textAlign: "right" }}>Price</Text></View>
          <View style={s.colVat}><Text style={{ ...s.thText, textAlign: "right" }}>{taxLabel} %</Text></View>
          <View style={s.colTotal}><Text style={{ ...s.thText, textAlign: "right" }}>Total</Text></View>
        </View>

        {/* Items Rows */}
        {items.map((item) => {
          const lineTotal = item.quantity * item.price;
          return (
            <View key={item.id} style={s.tableRow}>
              <View style={s.colDesc}><Text style={s.tdText}>{item.description || "—"}</Text></View>
              <View style={s.colQty}><Text style={s.tdTextRight}>{item.quantity}</Text></View>
              <View style={s.colUnit}><Text style={s.tdTextRight}>{item.unit}</Text></View>
              <View style={s.colPrice}><Text style={s.tdTextRight}>{fmt(item.price, currencySymbol)}</Text></View>
              <View style={s.colVat}><Text style={s.tdTextRight}>{item.vatPercent}%</Text></View>
              <View style={s.colTotal}><Text style={s.tdTextRight}>{fmt(lineTotal, currencySymbol)}</Text></View>
            </View>
          );
        })}

        {/* Bottom: Notes + Totals */}
        <View style={s.bottomRow}>
          <View style={s.notesBlock}>
            {notes ? (
              <>
                <Text style={s.notesLabel}>Notes</Text>
                <Text style={s.notesText}>{notes}</Text>
              </>
            ) : null}
          </View>

          <View style={s.totalsBlock}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{fmt(subtotal, currencySymbol)}</Text>
            </View>

            {discountAmount > 0 ? (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>
                  Discount {discountType === "percent" ? `(${discountValue}%)` : ""}
                </Text>
                <Text style={{ ...s.totalValue, color: "#FF3B30" }}>
                  -{fmt(discountAmount, currencySymbol)}
                </Text>
              </View>
            ) : null}

            {vatTotal > 0 ? (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>{taxLabel}</Text>
                <Text style={s.totalValue}>{fmt(vatTotal, currencySymbol)}</Text>
              </View>
            ) : null}

            <View style={s.grandDivider}>
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>Total</Text>
                <Text style={s.grandValue}>{fmt(grandTotal, currencySymbol)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            Thank you for your business. Payment is due by {fmtDate(dueDate)}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
