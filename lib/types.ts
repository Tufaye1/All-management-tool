export type ClientStatus = "active" | "paused" | "completed";

export type Client = {
  id: string;
  workspace_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  archived_at: string | null;
};

export type WorkspaceRole = "admin" | "account_lead" | "team_member" | "finance" | "viewer";

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
};
