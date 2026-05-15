"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, RefreshCw, Hash, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import styles from "./detail.module.css";

type SlackChannel = {
  id: string;
  name: string;
  is_private: boolean;
};

type SlackMessage = {
  ts: string;
  text: string;
  user: string;
  userName?: string;
};

type SlackMessagesProps = {
  workspaceId: string;
  clientId: string;
  initialChannelId: string | null;
};

export function SlackMessages({ workspaceId, clientId, initialChannelId }: SlackMessagesProps) {
  const { toast } = useToast();
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState(initialChannelId ?? "");
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch(`/api/integrations/slack/channels?workspaceId=${workspaceId}`);
        if (!res.ok) throw new Error("Failed to load channels");
        const data = await res.json();
        setChannels(data.channels ?? []);
      } catch {
        toast("Failed to load Slack channels");
      } finally {
        setIsLoadingChannels(false);
      }
    }
    loadChannels();
  }, [workspaceId, toast]);

  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId) return;
    setIsLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/integrations/slack/messages?workspaceId=${workspaceId}&channelId=${channelId}`
      );
      if (!res.ok) throw new Error("Failed to load messages");
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch {
      toast("Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [workspaceId, toast]);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel);
    }
  }, [selectedChannel, loadMessages]);

  async function handleLinkChannel(channelId: string) {
    setSelectedChannel(channelId);
    const supabase = createClient();
    await supabase
      .from("clients")
      .update({ slack_channel_id: channelId })
      .eq("id", clientId);
  }

  function formatTimestamp(ts: string) {
    const date = new Date(Number(ts) * 1000);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (isLoadingChannels) {
    return (
      <div className={styles.slackContainer}>
        <div className={styles.slackEmpty}>Loading Slack channels...</div>
      </div>
    );
  }

  return (
    <div className={styles.slackContainer}>
      <div className={styles.slackHeader}>
        <select
          className={styles.slackChannelSelect}
          value={selectedChannel}
          onChange={(e) => handleLinkChannel(e.target.value)}
        >
          <option value="">Select a channel</option>
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>
              {ch.is_private ? "🔒 " : "# "}{ch.name}
            </option>
          ))}
        </select>

        {selectedChannel && (
          <button
            className={styles.slackRefreshBtn}
            onClick={() => loadMessages(selectedChannel)}
            disabled={isLoadingMessages}
            title="Refresh messages"
          >
            <RefreshCw size={14} className={isLoadingMessages ? styles.spinning : ""} />
          </button>
        )}
      </div>

      {!selectedChannel && (
        <div className={styles.slackEmpty}>
          <MessageSquare size={32} />
          <p>Select a Slack channel to view messages</p>
        </div>
      )}

      {selectedChannel && isLoadingMessages && messages.length === 0 && (
        <div className={styles.slackEmpty}>Loading messages...</div>
      )}

      {selectedChannel && !isLoadingMessages && messages.length === 0 && (
        <div className={styles.slackEmpty}>
          <p>No messages in this channel</p>
        </div>
      )}

      {messages.length > 0 && (
        <div className={styles.slackMessageList}>
          {messages.map((msg) => (
            <div key={msg.ts} className={styles.slackMessage}>
              <div className={styles.slackMessageHeader}>
                <span className={styles.slackUserName}>{msg.userName ?? msg.user}</span>
                <span className={styles.slackTimestamp}>{formatTimestamp(msg.ts)}</span>
              </div>
              <p className={styles.slackMessageText}>{msg.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
