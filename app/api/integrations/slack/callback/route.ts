import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { exchangeSlackCode } from "@/lib/integrations/slack";

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
    const result = await exchangeSlackCode(code, origin);

    await supabase.from("workspace_integrations").upsert(
      {
        workspace_id: workspaceId,
        provider: "slack",
        access_token: result.access_token,
        refresh_token: null,
        token_expires_at: null,
        extra_data: {
          team_id: result.team.id,
          team_name: result.team.name,
          bot_user_id: result.bot_user_id,
        },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,provider" }
    );

    return NextResponse.redirect(
      new URL("/dashboard/settings?connected=slack", request.url)
    );
  } catch {
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=slack_failed", request.url)
    );
  }
}
