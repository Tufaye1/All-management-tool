"use client";

import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SuspendedPage() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-5)",
      background: "var(--color-bg-app)",
    }}>
      <div className="card-elevated" style={{
        maxWidth: "440px",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-8)",
      }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-full)",
          background: "var(--color-danger-light)",
          color: "var(--color-danger)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <ShieldOff size={28} />
        </div>

        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          fontWeight: "var(--weight-semibold)",
          letterSpacing: "var(--tracking-tight)",
          margin: 0,
        }}>
          Account Suspended
        </h2>

        <p style={{
          color: "var(--color-text-secondary)",
          margin: 0,
          lineHeight: 1.5,
        }}>
          Your access to this workspace has been temporarily disabled. Contact your workspace admin to restore access.
        </p>

        <button
          className="secondary"
          onClick={handleSignOut}
          style={{ marginTop: "var(--space-2)" }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
