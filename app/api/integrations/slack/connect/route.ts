import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildSlackAuthUrl } from "@/lib/integrations/slack";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("workspace_id", workspaceId)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const origin = request.nextUrl.origin;
  const authUrl = buildSlackAuthUrl(origin, workspaceId);
  return NextResponse.redirect(authUrl);
}
