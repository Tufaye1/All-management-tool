# Agency OS — Brainstorming Document

*An internal operations platform for an education marketing agency. Built solo with Claude Code, a little every day.*

---

## 1. The Vision (in plain words)

One web app where Tufayel's agency runs its entire operation. Project management is the spine — every client, every deliverable, every deadline lives there. Bolted onto that spine: finance (what we earn, what we spend, who owes us, profit per client), a lightweight sales pipeline, a unified dashboard, and integrations with the tools the team already uses (Slack, Google Drive, Google Calendar).

The agency runs 15+ education clients in parallel on 2-3 month engagements with a 20-person team. Built internally first. Architected so it can be sold as SaaS later without re-engineering.

---

## 2. What's In and What's Out

### Core (must exist for v1 to be useful)

- **Clients** — the central record everything attaches to
- **Projects** — 2-3 month engagement per client, can have multiple per client
- **Tasks** — assignable, with status, due date, owner, both a client tag and a function tag
- **People & Roles** — Admin, Account Lead, Team Member, Finance, Viewer (per-user overrides come later)
- **List view** of tasks with filters (by client, by function, by person, by status)
- **A single dashboard** for the admin showing the state of the agency at a glance

### Important (v2 — weeks/months after v1)

- Kanban view (same task data, different layout)
- Subtasks, dependencies, recurring tasks, project templates
- Finance: revenue tracking, cost tracking, payment status, invoice owner, profit per client
- PDF invoice generation (no online payments — just generate, send, mark paid manually)
- Lightweight CRM: leads, pipeline stages, convert-to-client on "Closed Won"
- Google Drive auto-folder creation on new project
- Slack embedding via Slack API

### Later (v3 and beyond)

- Calendar view + two-way Google Calendar sync
- Per-user permission overrides
- Reports / export
- Native mobile app (web responsive covers the gap for a long time)
- Multi-tenant onboarding flow for selling to other agencies

### Cut from scope (deliberately)

- **In-app chat** — Slack does this better; embed Slack instead
- **Time tracking** — flat-fee billing, not needed
- **Online payments / Stripe** — invoices are PDFs, payment is offline
- **Custom reports engine** — dashboard covers the real need

---

## 3. Key Design Decisions (the things that matter most)

**Dual-tag tasks.** Every task carries both a *client* tag and a *function* tag. Same data, two ways to read it: "show me everything for Client X" (account lead's view) and "show me all design tasks across all clients" (designer's view). This one decision makes the tool work for both organizational dimensions of the agency.

**Roles before per-user permissions.** Five roles cover ~90% of real permission needs. Build that first. Add per-user overrides later only if genuinely required — it's where a lot of internal tools get stuck.

**One responsive web app, not native mobile.** A mobile-first responsive web app gets the agency 90% of "real app" feel for 10% of the work. Native apps come only if the team demands them.

**Multi-tenant from day one.** Every piece of data is scoped to a workspace (the agency). When Tufayel sells this later, a new agency = a new workspace, not a re-engineering project.

**Lean on integrations, don't rebuild.** Slack for chat. Google Drive for files. Google Calendar for scheduling. Each of these is a product team's worth of work to rebuild. The tool's job is to stitch them together, not replace them.

**List view first, kanban and calendar later.** Same database, more layouts added over time. List view alone is the most powerful for managing 15+ clients.

---

## 4. The Honest Reality

A few things to keep clearly in mind:

- The full vision is a **4-6 month build solo with AI help**, not 1-2 months. The "tiny v1 fast, expand weekly" approach is what makes it actually ship.
- **Real-time chat replacement** was the biggest scope-killer in the original list. Cutting it (using Slack instead) is the single decision that makes the rest of the project feasible.
- **Finance is the killer feature** for the agency long-term. It's deferred to v2 not because it's unimportant, but because project management has to exist first for finance to attach to.
- **Some basics + AI help is enough** for this if scope stays disciplined. The risk isn't ability; it's adding features faster than they can be finished. Daily small wins > big weekend rewrites.

---

## 5. The Build Plan — A Little Every Day

This is structured as small daily/weekly chunks. Each week ends with something working and visible. Nothing here is rigid — slip a day, slip a week, no problem. The point is the sequence.

### Week 1 — Foundation (just get something running)

- **Day 1-2:** Pick the stack. Recommended: Next.js + Supabase (handles database, auth, and hosting for free in early stages; well-supported by Claude Code). Get a "hello world" page deployed online.
- **Day 3-4:** Set up Supabase tables for `users`, `workspaces`, `clients`. Add login (Supabase Auth handles this — Google login + email).
- **Day 5-7:** Build a "Clients" page — list clients, add a client, edit a client. Nothing fancy. This is the smallest possible working app.

**End of Week 1:** You can log in, see a list of clients, add one. That's it. Don't be discouraged — this is real progress.

### Week 2 — Projects and Tasks

- **Day 1-2:** Add a `projects` table. Each project belongs to a client. Build a Projects page (list, add, edit).
- **Day 3-5:** Add a `tasks` table with: title, description, status, due date, assignee, project_id, function_tag (design / marketing / strategy / etc.).
- **Day 6-7:** Build a basic task list view with filters: by client, by function, by assignee, by status.

**End of Week 2:** You can create clients → create projects → add tasks → filter them. This is the spine.

### Week 3 — People and Roles

- **Day 1-2:** Add a `team_members` table linked to workspace. Invite-by-email flow.
- **Day 3-4:** Add the 5 roles (Admin, Account Lead, Team Member, Finance, Viewer). Hardcode what each role can see/do for now.
- **Day 5-7:** Add permission checks to every page: hide pages/buttons based on role.

**End of Week 3:** Your team can be invited in. Each role sees only what they should.

### Week 4 — The Dashboard

- **Day 1-3:** Build the admin dashboard: active projects this week, who's working on what, tasks overdue, upcoming deadlines.
- **Day 4-5:** Add slimmed-down dashboards for Account Lead role and Team Member role.
- **Day 6-7:** Polish — mobile responsiveness check, fix the worst rough edges.

**End of Week 4 → v1 ships internally.** You and 2-3 team members start using it daily. Bugs and gaps will surface — that's the point. Use it for 1-2 weeks before adding anything new.

---

### Weeks 5-8 — Project Management Depth

- Subtasks (checklists inside a task)
- Project templates ("new client" generates 20 standard tasks)
- Recurring tasks (weekly reports, monthly check-ins)
- Task dependencies (Task B blocked until Task A is done)
- Kanban view (same task data, drag-and-drop columns)

### Weeks 9-12 — Finance Module

This is the killer feature. Build it carefully.

- `revenue_entries` (per client: amount, date, what for)
- `cost_entries` (per client: ad spend, freelancer fee, tool cost, etc.)
- `invoices` (per client: amount, status, owner, due date, paid date)
- Invoice PDF generation
- "Mark as paid" workflow
- Profit-per-client calculation
- Finance section of dashboard: who owes us, overdue invoices, this month's revenue and cost

### Weeks 13-16 — Integrations

- Google Drive: auto-create a folder when a project is created, show files tab on project page
- Slack: pull channel messages into the tool via Slack API
- Lightweight CRM module: leads, pipeline stages, "convert to client" on close

### Beyond Week 16

- Google Calendar two-way sync
- Calendar view of tasks
- Per-user permission overrides (only if actually needed)
- Productize for external sale: onboarding flow, billing, support pages

---

## 6. The Tech Stack — Recommendation

For "solo + Claude Code + ship daily," this stack is hard to beat:

- **Frontend:** Next.js (React-based, Claude Code knows it extremely well)
- **Database + Auth + Storage:** Supabase (Postgres database, built-in auth, file storage — free tier covers early use)
- **Hosting:** Vercel (free tier, automatic deploys from GitHub)
- **PDF generation:** react-pdf or Puppeteer (for invoices later)
- **Integrations:** Slack API, Google Drive API, Google Calendar API (all well-documented, all have free tiers)

Total cost in the first few months: **~$0**. Costs scale up only when usage grows.

---

## 7. The Riskiest Things to Watch For

These are the patterns that kill solo projects. Knowing them in advance helps avoid them.

- **Feature creep mid-week.** Stick to the week's plan. New ideas go in a `ideas.md` file, not into the current week.
- **Rebuilding before using.** Don't redesign v1 before the team has actually used it for 2 weeks. Real usage reveals real problems; speculation reveals fake ones.
- **Permissions complexity early.** Resist building per-user permissions in v1. Roles are enough.
- **Trying to make it pretty too soon.** Make it work, make it ugly, ship it. Polish in week 4, not week 1.
- **Solving "what if we sell it" problems now.** Multi-tenant scoping is enough preparation. Everything else waits.

---

## 8. What to Do Tomorrow

1. Open Claude Code.
2. Create a new Next.js project.
3. Sign up for Supabase (free) and Vercel (free).
4. Connect everything together and deploy the default "Hello World" page to a live URL.
5. That's Day 1 done.

The hardest part of building software solo isn't any single feature — it's keeping a consistent pace. One small thing every day. In four weeks you'll have something real. In four months you'll have something your team can't imagine living without.
