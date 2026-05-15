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

export type ProjectStatus = "planning" | "active" | "review" | "completed" | "paused";

export type Project = {
  id: string;
  workspace_id: string;
  client_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export type TaskStatus = "todo" | "in_progress" | "review" | "done" | "blocked";
export type FunctionTag = "design" | "marketing" | "strategy" | "content" | "ads" | "analytics" | "admin";
export type Priority = "low" | "normal" | "high" | "urgent";

export type Task = {
  id: string;
  workspace_id: string;
  project_id: string;
  client_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  function_tag: FunctionTag;
  assignee_id: string | null;
  reporter_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  priority: Priority;
  position: number;
  created_at: string;
  updated_at: string;
};

export type TaskWithRelations = Task & {
  projects: { name: string } | null;
  clients: { name: string } | null;
};

export type WorkspaceRole = "admin" | "account_lead" | "team_member" | "finance" | "viewer";

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
};

export type WorkspaceMemberWithEmail = WorkspaceMember & {
  email: string;
  full_name: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};

export type Invitation = {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

/* -------- Workspace -------- */

export type Workspace = {
  id: string;
  name: string;
  owner_id: string;
  currency: string;
  created_at: string;
};

/* -------- Finance -------- */

export type CostCategory = "ad_spend" | "freelancer" | "tools" | "other";
export type InvoiceStatus = "unpaid" | "paid" | "overdue";

export type RevenueEntry = {
  id: string;
  workspace_id: string;
  client_id: string;
  amount: number;
  description: string | null;
  date: string;
  created_by: string;
  created_at: string;
};

export type CostEntry = {
  id: string;
  workspace_id: string;
  client_id: string;
  amount: number;
  category: CostCategory;
  description: string | null;
  date: string;
  created_by: string;
  created_at: string;
};

export type Invoice = {
  id: string;
  workspace_id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  status: InvoiceStatus;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
};

export type RevenueEntryWithClient = RevenueEntry & {
  clients: { name: string } | null;
};

export type CostEntryWithClient = CostEntry & {
  clients: { name: string } | null;
};

export type InvoiceWithClient = Invoice & {
  clients: { name: string } | null;
};
