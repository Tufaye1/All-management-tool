import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeCalendarCode } from "@/lib/integrations/google-calendar";

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
    const tokens = await exchangeCalendarCode(code, origin);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    await supabase.from("workspace_integrations").upsert(
      {
        workspace_id: workspaceId,
        provider: "google_calendar",
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        extra_data: {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,provider" }
    );

    return NextResponse.redirect(
      new URL("/dashboard/settings?connected=google_calendar", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=google_calendar_failed", request.url)
    );
  }
}
