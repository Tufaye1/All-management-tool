import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div style={{
      background: "var(--color-bg-app)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-5)",
    }}>
      <div className="card-elevated" style={{
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
      }}>
        <h2>Welcome to Agency OS</h2>
        <p style={{
          color: "var(--color-text-secondary)",
          fontSize: "var(--text-base)",
          margin: 0,
        }}>
          Signed in as {user?.email}
        </p>
      </div>
    </div>
  );
}
