import { createClient } from "@/lib/supabase/server";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

function getRedirectUri(origin: string): string {
  return `${origin}/api/integrations/google-calendar/callback`;
}

export function buildGoogleCalendarAuthUrl(origin: string, workspaceId: string): string {
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

export async function exchangeCalendarCode(
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
    throw new Error(`Google Calendar token exchange failed: ${err}`);
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

export async function getCalendarAccessToken(workspaceId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_integrations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("provider", "google_calendar")
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

export type CalendarEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  location: string | null;
  htmlLink: string;
};

export async function fetchUpcomingEvents(
  accessToken: string,
  maxResults = 20
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    maxResults: String(maxResults),
    orderBy: "startTime",
    singleEvents: "true",
    timeMin: new Date().toISOString(),
  });

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to fetch calendar events: ${err}`);
  }

  const data = await res.json();
  const items = data.items ?? [];

  return items.map((item: Record<string, unknown>) => ({
    id: item.id as string,
    summary: (item.summary as string) ?? "Untitled",
    start: ((item.start as Record<string, string>)?.dateTime ??
      (item.start as Record<string, string>)?.date) as string,
    end: ((item.end as Record<string, string>)?.dateTime ??
      (item.end as Record<string, string>)?.date) as string,
    location: (item.location as string) ?? null,
    htmlLink: (item.htmlLink as string) ?? "",
  }));
}
