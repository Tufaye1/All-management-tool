import { createClient } from "@/lib/supabase/server";

const SLACK_AUTH_URL = "https://slack.com/oauth/v2/authorize";
const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";
const SLACK_API = "https://slack.com/api";
const SCOPES = "channels:read,channels:history,groups:read,groups:history,users:read";

function getRedirectUri(origin: string): string {
  return `${origin}/api/integrations/slack/callback`;
}

export function buildSlackAuthUrl(origin: string, workspaceId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID ?? "",
    scope: SCOPES,
    redirect_uri: getRedirectUri(origin),
    state: workspaceId,
  });
  return `${SLACK_AUTH_URL}?${params.toString()}`;
}

export async function exchangeSlackCode(
  code: string,
  origin: string
): Promise<{
  access_token: string;
  team: { id: string; name: string };
  bot_user_id: string;
}> {
  const res = await fetch(SLACK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.SLACK_CLIENT_ID ?? "",
      client_secret: process.env.SLACK_CLIENT_SECRET ?? "",
      redirect_uri: getRedirectUri(origin),
    }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack token exchange failed: ${data.error}`);
  return data;
}

/** Get the Slack bot token for a workspace. */
export async function getSlackToken(workspaceId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspace_integrations")
    .select("access_token")
    .eq("workspace_id", workspaceId)
    .eq("provider", "slack")
    .single();
  return data?.access_token ?? null;
}

/** List Slack channels the bot can see. */
export async function listSlackChannels(
  token: string
): Promise<{ id: string; name: string; is_private: boolean }[]> {
  const res = await fetch(`${SLACK_API}/conversations.list?types=public_channel,private_channel&limit=200`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack channels failed: ${data.error}`);
  return (data.channels ?? []).map((ch: { id: string; name: string; is_private: boolean }) => ({
    id: ch.id,
    name: ch.name,
    is_private: ch.is_private,
  }));
}

export type SlackMessage = {
  ts: string;
  text: string;
  user: string;
  userName?: string;
};

/** Fetch recent messages from a Slack channel. */
export async function fetchSlackMessages(
  token: string,
  channelId: string,
  limit = 30
): Promise<SlackMessage[]> {
  const res = await fetch(
    `${SLACK_API}/conversations.history?channel=${channelId}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack messages failed: ${data.error}`);

  // Resolve user names
  const messages: SlackMessage[] = data.messages ?? [];
  const userIds = [...new Set(messages.map((m) => m.user).filter(Boolean))];
  const userMap = new Map<string, string>();

  for (const uid of userIds) {
    try {
      const userRes = await fetch(`${SLACK_API}/users.info?user=${uid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = await userRes.json();
      if (userData.ok) {
        userMap.set(uid, userData.user?.real_name || userData.user?.name || uid);
      }
    } catch {
      // Skip failed user lookups
    }
  }

  return messages.map((m) => ({
    ts: m.ts,
    text: m.text,
    user: m.user,
    userName: userMap.get(m.user) ?? m.user,
  }));
}
