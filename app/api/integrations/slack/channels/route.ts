import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSlackToken, listSlackChannels } from "@/lib/integrations/slack";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getSlackToken(workspaceId);
    if (!token) {
      return NextResponse.json({ error: "Slack not connected" }, { status: 400 });
    }

    const channels = await listSlackChannels(token);
    return NextResponse.json({ channels });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
