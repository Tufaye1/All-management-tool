import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeGoogleCode } from "@/lib/integrations/google-drive";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const workspaceId = request.nextUrl.searchParams.get("state");

  if (!code || !workspaceId) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=missing_params", request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const origin = request.nextUrl.origin;
    const tokens = await exchangeGoogleCode(code, origin);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Upsert integration record
    await supabase.from("workspace_integrations").upsert(
      {
        workspace_id: workspaceId,
        provider: "google_drive",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        extra_data: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,provider" }
    );

    return NextResponse.redirect(
      new URL("/dashboard/settings?connected=google_drive", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=google_drive_failed", request.url)
    );
  }
}
