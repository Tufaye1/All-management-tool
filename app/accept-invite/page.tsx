"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type InviteData = {
  id: string;
  workspace_id: string;
  email: string;
  role: string;
  expires_at: string;
};

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-bg-app)",
      }}>
        <p style={{ color: "var(--color-text-secondary)" }}>Loading...</p>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "found" | "expired" | "error" | "accepted">("loading");
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No invitation token provided.");
      return;
    }

    async function loadInvite() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("invitations")
        .select("id, workspace_id, email, role, expires_at, accepted_at")
        .eq("token", token!)
        .limit(1)
        .single();

      if (fetchError || !data) {
        setStatus("error");
        setError("Invitation not found or already used.");
        return;
      }

      if (data.accepted_at) {
        setStatus("error");
        setError("This invitation has already been accepted.");
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setStatus("expired");
        return;
      }

      setInvite(data);
      setStatus("found");
    }

    loadInvite();
  }, [token]);

  async function handleAccept() {
    if (!invite) return;
    setStatus("loading");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not logged in — send to login with redirect back here
      const currentUrl = window.location.href;
      router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Check if the trigger already added this user to the workspace on signup
    const { data: existing } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", invite.workspace_id)
      .eq("user_id", user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      // Trigger handled it — just ensure invitation is marked accepted
      await supabase
        .from("invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id)
        .is("accepted_at", null);

      setStatus("accepted");
      setTimeout(() => router.push("/dashboard"), 1500);
      return;
    }

    // Fallback: trigger didn't fire (existing user accepting invite)
    // Add them to the workspace manually
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
      });

    if (memberError) {
      setStatus("error");
      setError(memberError.message);
      return;
    }

    // Mark invitation as accepted
    await supabase
      .from("invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id)
      .is("accepted_at", null);

    setStatus("accepted");
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  const ROLE_LABELS: Record<string, string> = {
    admin: "Admin",
    account_lead: "Account Lead",
    team_member: "Team Member",
    finance: "Finance",
    viewer: "Viewer",
  };

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
        maxWidth: "420px",
        width: "100%",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-4)",
        padding: "var(--space-8)",
      }}>
        {status === "loading" && (
          <p style={{ color: "var(--color-text-secondary)" }}>Loading invitation...</p>
        )}

        {status === "error" && (
          <>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)" }}>
              Invalid Invitation
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>{error}</p>
            <button className="primary" onClick={() => router.push("/login")} style={{ marginTop: "var(--space-2)" }}>
              Go to Login
            </button>
          </>
        )}

        {status === "expired" && (
          <>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)" }}>
              Invitation Expired
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
              This invitation has expired. Ask your team admin to send a new one.
            </p>
            <button className="primary" onClick={() => router.push("/login")} style={{ marginTop: "var(--space-2)" }}>
              Go to Login
            </button>
          </>
        )}

        {status === "found" && invite && (
          <>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)" }}>
              You&apos;re Invited
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
              You&apos;ve been invited to join as <strong>{ROLE_LABELS[invite.role] || invite.role}</strong>.
            </p>
            <p style={{ color: "var(--color-text-tertiary)", fontSize: "var(--text-sm)", margin: 0 }}>
              Invited: {invite.email}
            </p>
            <button className="primary" onClick={handleAccept} style={{ marginTop: "var(--space-2)" }}>
              Accept Invitation
            </button>
          </>
        )}

        {status === "accepted" && (
          <>
            <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--color-success)" }}>
              Welcome to the Team!
            </h2>
            <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
              Redirecting to your dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
