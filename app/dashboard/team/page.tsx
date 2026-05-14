import { Users } from "lucide-react";

export default function TeamPage() {
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
        <Users size={40} style={{ color: "var(--color-text-tertiary)" }} />
        <h2>Team</h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", margin: 0 }}>
          Team management is coming in Week 3.
        </p>
      </div>
    </div>
  );
}
