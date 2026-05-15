import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAccessToken, createDriveFolder } from "@/lib/integrations/google-drive";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { projectId, clientName, projectName, workspaceId } = body;

  if (!projectId || !clientName || !projectName || !workspaceId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const accessToken = await getGoogleAccessToken(workspaceId);
    if (!accessToken) {
      return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 });
    }

    const folderName = `${clientName} — ${projectName}`;
    const folderUrl = await createDriveFolder(accessToken, folderName);

    // Save folder URL to project
    await supabase
      .from("projects")
      .update({ drive_folder_url: folderUrl })
      .eq("id", projectId);

    return NextResponse.json({ folderUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
