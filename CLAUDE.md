# Agency OS — Project Context for Claude Code

> This file is read by Claude Code at the start of every session.
> It locks the project direction, design language, and rules so the codebase stays consistent.

---

## What we're building

An internal operations platform for an education marketing agency. Project management is the spine — clients, projects, tasks. Finance, lightweight CRM, dashboard, reports, and integrations (Slack, Google Drive, Google Calendar) attach to it. Built internally first, architected multi-tenant so it can be sold to other agencies later.

**Team size:** 20 users · **Concurrent clients:** 15+ · **Engagement length:** 2–3 months per client.

---

## Tech stack — DO NOT CHANGE WITHOUT ASKING

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database / Auth / Storage:** Supabase
- **Hosting:** Vercel
- **Styling:** Plain CSS using variables from `styles/design-system.css`. **Do NOT use Tailwind default classes for colors, radii, or fonts.** If you need utility classes for layout, use Tailwind for `flex`, `grid`, `gap`, etc. only — never for color, font, or radius.
- **PDF generation:** `@react-pdf/renderer` (for invoices)
- **Icons:** `lucide-react` (matches the soft, rounded aesthetic)

---

## DESIGN RULES — strict, no drift allowed

The visual language is **Apple / iOS — soft, rounded, premium, glassy, light mode.**

### Required reading
Before writing any UI component, **read `styles/design-system.css`** and use only the CSS variables defined there.

### Hard rules
1. **Colors:** Only use `var(--color-*)` from the design system. Never hardcode hex values. Never use Tailwind's `blue-500`, `gray-200`, etc.
2. **Primary accent is iOS Blue `#007AFF`** — already `var(--color-primary)`. Use it for primary buttons, links, active states, key numbers.
3. **Font:** `var(--font-text)` and `var(--font-display)` only. Both resolve to SF Pro via the system stack. Never import Google Fonts. Never use Inter, Roboto, Geist.
4. **Radii:** Soft and rounded. Use `var(--radius-md)` (12px) for inputs/buttons, `var(--radius-lg)` (16px) for cards, `var(--radius-xl)` (20px) for big containers. Never use less than 8px.
5. **Shadows:** Subtle only. Use `var(--shadow-sm/md/lg)`. Never use harsh shadows or glows.
6. **Spacing:** Use `var(--space-*)` tokens. Never hardcode pixel values for margins/padding.
7. **Typography weight:** Use 500 (medium) and 600 (semibold) primarily. Avoid 700+ except for hero numbers. Headings use `letter-spacing: var(--tracking-tight)`.
8. **No emoji in UI** — use `lucide-react` icons.
9. **Light mode only for now.** Dark mode comes later — but keep `var(--color-*)` references so the swap is easy.
10. **Mobile-first responsive.** Every page must work on a 375px-wide screen as well as a 1440px desktop.
11. **Inline styles for data-driven styling.** When per-item visual differences come from data (e.g., kanban column colors), use inline styles via constants — CSS Modules class lookups are unreliable for this pattern.

### Pattern library
- **Cards:** `background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-5);` — no border, optional `box-shadow: var(--shadow-sm)`.
- **Primary button:** `<button class="primary">` — already styled in design-system.css.
- **Secondary button:** `<button class="secondary">`.
- **Pills / status badges:** `<span class="pill pill-success">ON TRACK</span>` etc.
- **Page background:** `var(--color-bg-app)` (#F5F5F7) — soft off-white, not pure white.
- **Glass nav bar:** apply `.glass-bar` class for top nav / sticky bars.
- **iOS segmented tabs:** `.tabs` / `.tab` / `.tabActive` pattern used across settings, client detail, tasks.

---

## ARCHITECTURE DECISIONS — already made, do not relitigate

- **Multi-tenant from day one.** Every database row that isn't a global lookup has a `workspace_id` foreign key. RLS (Row Level Security) policies enforce isolation in Supabase.
- **Tasks have dual tags:** every task belongs to a `project_id` (→ client) AND a `function_tag` (design / marketing / strategy / etc.). UI must support filtering by either.
- **5 roles:** `admin`, `account_lead`, `team_member`, `finance`, `viewer`. Permissions are role-based, not per-user. Encoded in code, not a DB table (for now).
- **No in-app chat.** Slack integration only (read messages via Slack API).
- **No time tracking.** Flat-fee billing.
- **No online payments.** Invoices are PDFs. Payment status is manually marked.
- **Views:** List view + Kanban toggle on tasks page. Calendar view planned later.
- **Middleware uses `getSession()`** not `getUser()` — avoids Vercel edge timeout. Full JWT verification happens in each page's server component.

---

## RULES FOR CLAUDE CODE WORKING ON THIS PROJECT

1. **Ask before changing the tech stack, design system, or architectural decisions above.** Tufayel will handle all API keys, signups, and product decisions. Bring decisions to him; don't guess.
2. **When in doubt about design, match the existing patterns** in the codebase. Don't invent new component styles.
3. **Small commits, one feature at a time.** If a prompt would touch 10+ files, pause and propose a plan first.
4. **Mobile-first.** Always test layouts at 375px width mentally before writing them.
5. **Read `styles/design-system.css` before writing any UI.** Always.
6. **No external font imports.** Use the system font stack already defined.
7. **No Tailwind color classes.** Layout utilities only (`flex`, `grid`, `gap`, `p-4` etc. are fine if Tailwind is set up — never `bg-blue-500`, `text-gray-700`, etc.).
8. **When unsure, ask.** A 30-second clarifying question saves 2 hours of wrong-direction code.

---

## WHO IS TUFAYEL

Tufayel runs the agency and is building this himself with Claude Code's help. He has some coding basics (tutorials, small scripts) and prefers concise, direct communication. He'll handle all signups, API keys, and product decisions. Claude Code's job is the code and the technical implementation. Tufayel's job is direction, decisions, and testing.

---

## What's been built — module status

| Module | Status | Key files |
|--------|--------|-----------|
| **Auth** | ✅ Complete | `/login`, `/signup`, `/auth/callback`, `/accept-invite` |
| **Dashboard** | ✅ Complete | `/dashboard` — stat cards (clients, tasks, projects), pipeline summary, finance summary (monthly + all-time), my tasks, recent activity, recent clients |
| **Clients** | ✅ Complete | `/dashboard/clients` — list + add/edit modals. `/dashboard/clients/[clientId]` — detail with Overview/Projects/Slack tabs, Drive folder links on project cards |
| **Tasks** | ✅ Complete | `/dashboard/tasks` — list view + kanban toggle, 5 filter dropdowns, task detail slide-in panel, drag-and-drop status changes |
| **Leads / CRM** | ✅ Complete | `/dashboard/leads` — kanban board (6 status columns with tinted backgrounds), lead cards with drag-and-drop, add/edit modals, pipeline value tracking |
| **Team** | ✅ Complete | `/dashboard/team` — member list (role management, remove), pending invitations (copy link, revoke) |
| **Finance** | ✅ Complete | `/dashboard/finance` — revenue/cost tracking, per-client P&L, invoices table, recent transactions. `/dashboard/finance/invoice-generator` — full invoice builder with line items, PDF generation, saves to DB |
| **Reports** | ✅ Complete | `/dashboard/reports` — monthly P&L by client, invoice summary, period selector (month/quarter/year/all-time), CSV export for revenue, costs, invoices, P&L |
| **Settings** | ✅ Complete | `/dashboard/settings` — 5 tabs: Workspace (name, currency, integrations), Profile, Security, Templates (admin), Danger Zone |
| **Notifications** | ✅ Complete | Bell icon in nav — shows overdue tasks, upcoming deadlines |
| **Google Drive** | ✅ Code complete | OAuth2 flow, auto-create Drive folders on project creation, folder links on project cards. **Needs env vars:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Slack** | ✅ Code complete | OAuth2 flow, channel messages viewer on client detail pages, channel picker. **Needs env vars:** `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` |
| **Project Templates** | ✅ Complete | Template management in Settings, "Education Campaign" default template with 15 tasks, template dropdown in project creation modal, auto-creates tasks with calculated due dates |

---

## Database tables (Supabase)

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `workspaces` | Multi-tenant container | `id`, `name`, `owner_id`, `currency` (default 'USD') |
| `workspace_members` | Links users to workspaces with a role | `workspace_id`, `user_id`, `role` |
| `clients` | Agency clients. Soft delete via `archived_at` | `workspace_id`, `name`, `status`, `contact_name`, `contact_email`, `contact_phone`, `slack_channel_id` |
| `projects` | Belongs to a client | `workspace_id`, `client_id`, `name`, `status`, `start_date`, `end_date`, `drive_folder_url` |
| `tasks` | Dual-tagged: `project_id` + `function_tag` | `workspace_id`, `project_id`, `client_id`, `title`, `status`, `function_tag`, `assignee_id`, `priority`, `position`, `due_date` |
| `leads` | CRM pipeline | `workspace_id`, `name`, `email`, `company`, `source`, `status`, `assigned_to`, `estimated_value`, `won_date`, `lost_reason` |
| `invitations` | Pending team invites | `workspace_id`, `email`, `role`, `token`, `expires_at`, `accepted_at` |
| `profiles` | User profiles (auto-created via trigger) | `id` (refs auth.users), `full_name`, `avatar_url` |
| `revenue_entries` | Revenue line items per client | `workspace_id`, `client_id`, `amount`, `description`, `date` |
| `cost_entries` | Cost line items per client | `workspace_id`, `client_id`, `amount`, `category`, `description`, `date` |
| `invoices` | Invoice records | `workspace_id`, `client_id`, `invoice_number`, `amount`, `status` (unpaid/paid/overdue), `due_date`, `paid_date` |
| `workspace_integrations` | OAuth tokens for integrations | `workspace_id`, `provider`, `access_token`, `refresh_token`, `token_expires_at`, `extra_data` |
| `project_templates` | Reusable project task blueprints | `workspace_id`, `name`, `description`, `created_by` |
| `template_tasks` | Tasks within a template | `template_id`, `title`, `function_tag`, `priority`, `due_days_from_start`, `position` |

**RLS:** All tables have Row Level Security policies enforcing workspace isolation.

**Triggers on `auth.users`:**
- `handle_new_user`: checks invitations → joins existing workspace or creates new one
- `handle_new_profile`: creates a profile row with `full_name` from signup metadata

---

## App routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Server redirect | Sends to `/dashboard` or `/login` |
| `/login` | Client component | Email/password + Google OAuth |
| `/signup` | Client component | Name + email + password, email confirmation |
| `/auth/callback` | Route handler | OAuth code exchange |
| `/accept-invite` | Client component | Public page — validates invite token, accepts invitation |
| `/dashboard` | Server component | Dashboard — 4 stat cards, pipeline summary, finance summary, my tasks, recent activity, recent clients |
| `/dashboard/clients` | Server + Client | Client list with add/edit modals |
| `/dashboard/clients/[clientId]` | Server + Client | Client detail: Overview / Projects / Slack tabs. Drive folder links on project cards. Template dropdown in project creation. |
| `/dashboard/tasks` | Server + Client | List + Kanban toggle, 5 filter dropdowns, task detail slide-in panel |
| `/dashboard/leads` | Server + Client | CRM kanban board, 6 status columns with drag-and-drop |
| `/dashboard/team` | Server + Client | Team member list, pending invitations |
| `/dashboard/finance` | Server + Client | Finance dashboard — stat cards, per-client P&L, invoices table, recent transactions |
| `/dashboard/finance/invoice-generator` | Server + Client | Full invoice builder — line items grid, PDF generation + DB save |
| `/dashboard/reports` | Server + Client | Monthly P&L by client, invoice summary, period selector, CSV export |
| `/dashboard/settings` | Server + Client | 5-tab settings — Workspace (+ integrations), Profile, Security, Templates, Danger Zone |

**API routes:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/integrations/google-drive/connect` | GET | Redirects to Google OAuth consent |
| `/api/integrations/google-drive/callback` | GET | Exchanges code for tokens, saves to DB |
| `/api/integrations/google-drive/create-folder` | POST | Creates Drive folder for a project |
| `/api/integrations/slack/connect` | GET | Redirects to Slack OAuth consent |
| `/api/integrations/slack/callback` | GET | Exchanges code for bot token, saves to DB |
| `/api/integrations/slack/channels` | GET | Lists workspace Slack channels |
| `/api/integrations/slack/messages` | GET | Fetches messages from a channel |

All dashboard routes have `loading.tsx` with shimmer skeletons.

---

## Lib modules

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | Browser Supabase client (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server Supabase client (`createServerClient` with cookies) |
| `lib/types.ts` | All shared TypeScript types: `Client`, `Project`, `Task`, `Lead`, `Workspace`, `RevenueEntry`, `CostEntry`, `Invoice`, `WorkspaceIntegration`, `ProjectTemplate`, `TemplateTask`, etc. |
| `lib/permissions.ts` | Role-based permission matrix. 15 permissions across 7 domains (including leads). `hasPermission()`, `canSeeNavItem()`. |
| `lib/currency.ts` | `getCurrencySymbol(code)`, `formatCurrency(amount, code)`, `formatCurrencyPrecise(amount, code)`. Supports: USD, BDT, EUR, GBP, INR, AED. |
| `lib/hooks/use-permissions.ts` | Client-side hook for permission checking |
| `lib/integrations/google-drive.ts` | Google Drive OAuth helpers: `buildGoogleAuthUrl()`, `exchangeGoogleCode()`, `refreshGoogleToken()`, `getGoogleAccessToken()`, `createDriveFolder()` |
| `lib/integrations/slack.ts` | Slack API helpers: `buildSlackAuthUrl()`, `exchangeSlackCode()`, `getSlackToken()`, `listSlackChannels()`, `fetchSlackMessages()` |

---

## Shared components (`components/`)

| Component | Purpose |
|-----------|---------|
| `<ToastProvider>` + `useToast()` | Toast notifications for all success/error actions |
| `<Breadcrumbs>` | Chevron-separated navigation trail |
| `<Skeleton>` + `<PageSkeleton>` + `<StatCardSkeleton>` + `<RowSkeleton>` | Shimmer loading skeletons |
| `<PermissionGate>` | Conditional rendering based on role/permission |
| `<NotificationBell>` | Notification bell in nav — overdue tasks, upcoming deadlines |

---

## Permissions system

5 roles: `admin`, `account_lead`, `team_member`, `finance`, `viewer`.

| Permission | admin | account_lead | team_member | finance | viewer |
|------------|-------|--------------|-------------|---------|--------|
| clients:read/write | ✅/✅ | ✅/✅ | ✅/❌ | ✅/❌ | ✅/❌ |
| projects:read/write | ✅/✅ | ✅/✅ | ✅/❌ | ✅/❌ | ✅/❌ |
| tasks:read/write_own/write_all | ✅/✅/✅ | ✅/✅/✅ | ✅/✅/❌ | ✅/❌/❌ | ✅/❌/❌ |
| leads:read/write | ✅/✅ | ✅/✅ | ✅/❌ | ❌/❌ | ✅/❌ |
| finance:read/write | ✅/✅ | ❌/❌ | ❌/❌ | ✅/✅ | ❌/❌ |
| team:read/invite/manage | ✅/✅/✅ | ✅/❌/❌ | ✅/❌/❌ | ✅/❌/❌ | ✅/❌/❌ |
| Settings page | ✅ (all tabs) | ✅ (no templates) | ✅ (no templates) | ✅ (no templates) | ✅ (no templates) |
| Reports page | ✅ | ❌ | ❌ | ✅ | ❌ |

---

## Sidebar navigation

240px fixed sidebar (hamburger on mobile). Nav items: Dashboard, Clients, Tasks, Leads, Team, Finance, Reports, Settings. Filtered by role via `canSeeNavItem()`. Shows user's full name + email + notification bell. Sign out at bottom.

---

## Key UI patterns

- **Task detail panel:** Slide-in from right (440px desktop, full screen mobile). Inline editable title/description. Auto-save with debounce.
- **Kanban views:** Tasks page (5 columns by status) + Leads page (6 columns by pipeline stage). Both have drag-and-drop. Leads columns have tinted backgrounds via inline styles.
- **View toggle:** iOS-style segmented control (List | Board) on tasks page.
- **Finance dashboard:** 4 stat cards (revenue, costs, net profit, outstanding). Per-client P&L table. Invoices table with Mark Paid + Download PDF. Recent transactions list.
- **Reports page:** Period selector (This Month / Last Month / This Quarter / This Year / All Time). P&L by client table. Invoice summary stats. CSV export cards for revenue, costs, invoices, P&L.
- **Dashboard finance card:** Horizontal summary card showing monthly revenue, costs, net profit, outstanding invoices — each with all-time subtotal. Permission-gated to `finance:read`.
- **Invoice generator:** Left settings sidebar (language, currency, tax label). Main form: logo upload, billing from/to, meta fields, line items grid (CSS Grid, 7 columns), notes, discount, totals. Generates PDF via `@react-pdf/renderer` and saves to DB.
- **Currency system:** Workspace-level currency stored in `workspaces.currency`. `lib/currency.ts` provides formatting helpers used across all finance pages. No hardcoded `$` anywhere.
- **Project templates:** Template dropdown in project creation modal. Selecting a template auto-creates tasks with calculated due dates based on project start_date + `due_days_from_start`.
- **Integrations:** Connect buttons in Settings > Workspace tab. Google Drive auto-creates folders on project creation. Slack shows channel messages in client detail Slack tab.
- **Page titles:** Each route exports `metadata.title`, root layout uses `%s — Agency OS` template.
- **Toast notifications:** Success/error toasts on all CRUD actions.
- **Loading skeletons:** All dashboard routes have `loading.tsx` with shimmer skeletons matching page content shapes.

---

## Finance module — technical details

**Important field names (match DB exactly):**
- `revenue_entries`: uses `date` (not `entry_date`), `client_id`, `amount`, `description`
- `cost_entries`: uses `date` (not `entry_date`), `client_id` (required, not nullable), `category`, `amount`
- `invoices`: uses `created_at` (not `issued_date`), `status` CHECK constraint allows only `unpaid`, `paid`, `overdue`

**Invoice generator flow:**
1. User fills form → clicks "Generate Document"
2. PDF generated client-side via `@react-pdf/renderer` → downloaded as `INV-XXX.pdf`
3. Invoice saved to `invoices` table with status `unpaid`
4. Redirects back to `/dashboard/finance`

**CSS note:** CSS Modules `composes` property cannot be used inside `@media` blocks (Turbopack limitation). Use explicit declarations instead.

---

## Known issues

1. **Invite flow uses shareable links** (copy-paste) instead of email delivery — we only have the anon key, not service role key.
2. **Profiles table SQL must be run manually** in Supabase SQL Editor (profiles table, RLS policies, trigger, backfill).
3. **Invoice PDF is simple format** — the `invoice-pdf.tsx` used from the finance dashboard "Download PDF" button generates a basic single-amount PDF. The full invoice generator at `/dashboard/finance/invoice-generator` produces a detailed line-items PDF via `invoice-document.tsx`.
4. **Google Drive + Slack need env vars** — `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` must be set in Vercel + `.env.local` before integrations work.
5. **Next.js 16 middleware deprecation** — middleware.ts works but shows a deprecation warning. Next.js 16 prefers `proxy` convention. Not urgent to migrate.

---

## Next session starts here

All core modules are complete. Here's what remains:

### Remaining features
1. **Google Calendar integration** — show upcoming meetings, sync task deadlines to calendar. OAuth2 flow + Calendar API.
2. **Dark mode** — all `var(--color-*)` references are in place, just need alternate values in design-system.css.
3. **Calendar view for tasks** — third view option alongside List and Board on tasks page.

### Polish & improvements
4. **Test finance module end-to-end** — add revenue, add cost, create invoice, mark paid, download PDF, change currency, verify it updates everywhere.
5. **Responsive audit** — test all pages at 375px width, fix any overflow or layout issues.
6. **Performance** — consider pagination for large datasets (clients list, tasks list, leads board).
