import type { Metadata } from "next";
import { DollarSign } from "lucide-react";

export const metadata: Metadata = { title: "Finance" };

export default function FinancePage() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-10) var(--space-5)",
      minHeight: "calc(100vh - 56px)",
    }}>
      <div className="card-elevated" style={{
        maxWidth: "400px",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
      }}>
        <DollarSign size={40} style={{ color: "var(--color-text-tertiary)" }} />
        <h2>Finance</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", margin: 0 }}>
          Finance module is coming after v1 ships.
        </p>
      </div>
    </div>
  );
}
