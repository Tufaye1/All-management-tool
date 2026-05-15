"use client";

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatCurrencyPrecise } from "@/lib/currency";

type InvoicePdfProps = {
  invoiceNumber: string;
  clientName: string;
  amount: number;
  issuedDate: string;
  dueDate: string;
  notes: string | null;
  currencyCode: string;
};

const pdfStyles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1D1D1F",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  agencyName: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#007AFF",
  },
  agencyTagline: {
    fontSize: 9,
    color: "#6E6E73",
    marginTop: 4,
  },
  invoiceLabel: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1D1D1F",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#6E6E73",
    textAlign: "right",
    marginTop: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  detailBlock: {
    flexDirection: "column",
    gap: 4,
  },
  detailLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6E6E73",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 12,
    color: "#1D1D1F",
  },
  amountBox: {
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  amountLabel: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#6E6E73",
  },
  amountValue: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#007AFF",
  },
  notesSection: {
    marginBottom: 32,
  },
  notesLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6E6E73",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 11,
    color: "#1D1D1F",
    lineHeight: 1.6,
  },
  footer: {
    position: "absolute",
    bottom: 48,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    paddingTop: 12,
  },
  footerText: {
    fontSize: 9,
    color: "#8E8E93",
    textAlign: "center",
  },
});

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function InvoicePdf({
  invoiceNumber,
  clientName,
  amount,
  issuedDate,
  dueDate,
  notes,
  currencyCode,
}: InvoicePdfProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header}>
          <View>
            <Text style={pdfStyles.agencyName}>RizeUP Global</Text>
            <Text style={pdfStyles.agencyTagline}>Education Marketing Agency</Text>
          </View>
          <View>
            <Text style={pdfStyles.invoiceLabel}>INVOICE</Text>
            <Text style={pdfStyles.invoiceNumber}>{invoiceNumber}</Text>
          </View>
        </View>

        <View style={pdfStyles.divider} />

        {/* Details */}
        <View style={pdfStyles.detailsRow}>
          <View style={pdfStyles.detailBlock}>
            <Text style={pdfStyles.detailLabel}>Bill To</Text>
            <Text style={pdfStyles.detailValue}>{clientName}</Text>
          </View>
          <View style={pdfStyles.detailBlock}>
            <Text style={pdfStyles.detailLabel}>Issued</Text>
            <Text style={pdfStyles.detailValue}>{formatDate(issuedDate)}</Text>
          </View>
          <View style={pdfStyles.detailBlock}>
            <Text style={pdfStyles.detailLabel}>Due Date</Text>
            <Text style={pdfStyles.detailValue}>{formatDate(dueDate)}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={pdfStyles.amountBox}>
          <Text style={pdfStyles.amountLabel}>Amount Due</Text>
          <Text style={pdfStyles.amountValue}>{formatCurrencyPrecise(amount, currencyCode)}</Text>
        </View>

        {/* Notes */}
        {notes && (
          <View style={pdfStyles.notesSection}>
            <Text style={pdfStyles.notesLabel}>Notes</Text>
            <Text style={pdfStyles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={pdfStyles.footer}>
          <Text style={pdfStyles.footerText}>
            Thank you for your business. Payment is due by {formatDate(dueDate)}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
