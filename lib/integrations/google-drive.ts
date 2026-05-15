import { createClient } from "@/lib/supabase/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

function getRedirectUri(origin: string): string {
  return `${origin}/api/integrations/google-drive/callback`;
}

export function buildGoogleAuthUrl(origin: string, workspaceId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: getRedirectUri(origin),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: workspaceId,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  code: string,
  origin: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: getRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  return res.json();
}

async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh Google token");
  return res.json();
}

/** Get a valid access token for the workspace, refreshing if expired. */
export async function getGoogleAccessToken(workspaceId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_integrations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("provider", "google_drive")
    .single();

  if (!data) return null;

  const expiresAt = data.token_expires_at ? new Date(data.token_expires_at) : null;
  const isExpired = expiresAt ? expiresAt.getTime() < Date.now() + 60_000 : false;

  if (!isExpired) return data.access_token;

  if (!data.refresh_token) return null;

  try {
    const refreshed = await refreshGoogleToken(data.refresh_token);
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    await supabase
      .from("workspace_integrations")
      .update({
        access_token: refreshed.access_token,
        token_expires_at: newExpiry,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    return refreshed.access_token;
  } catch {
    return null;
  }
}

/** Create a Google Drive folder and return its web URL. */
export async function createDriveFolder(
  accessToken: string,
  folderName: string
): Promise<string> {
  const res = await fetch(`${DRIVE_API}/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create Drive folder: ${err}`);
  }

  const file = await res.json();
  return `https://drive.google.com/drive/folders/${file.id}`;
}
