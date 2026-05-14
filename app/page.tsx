"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [supabaseStatus, setSupabaseStatus] = useState<"loading" | "connected" | "error">("loading");

  useEffect(() => {
    try {
      const supabase = createClient();
      if (supabase) {
        setSupabaseStatus("connected");
      }
    } catch {
      setSupabaseStatus("error");
    }
  }, []);

  return (
    <div style={{
      background: "var(--color-bg-app)",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-5)",
    }}>
      <div style={{
        background: "var(--color-bg-card)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        padding: "var(--space-10)",
        maxWidth: "420px",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
      }}>
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-2xl)",
          fontWeight: "var(--weight-semibold)",
          letterSpacing: "var(--tracking-tight)",
          color: "var(--color-text-primary)",
        }}>
          Agency OS
        </h2>
        <p style={{
          color: "var(--color-text-secondary)",
          fontSize: "var(--text-base)",
          margin: 0,
        }}>
          Loading something great.
        </p>
        <button className="primary" style={{ marginTop: "var(--space-2)" }}>
          Get Started
        </button>
        {supabaseStatus === "connected" && (
          <p style={{
            color: "var(--color-success)",
            fontSize: "var(--text-sm)",
            margin: 0,
          }}>
            Supabase connected
          </p>
        )}
        {supabaseStatus === "error" && (
          <p style={{
            color: "var(--color-danger)",
            fontSize: "var(--text-sm)",
            margin: 0,
          }}>
            Supabase connection failed
          </p>
        )}
      </div>
    </div>
  );
}
