# Agency OS — Project Context for Claude Code

> This file is read by Claude Code at the start of every session.
> It locks the project direction, design language, and rules so the codebase stays consistent.

---

## What we're building

An internal operations platform for an education marketing agency. Project management is the spine — clients, projects, tasks. Finance, lightweight CRM, dashboard, and integrations (Slack, Google Drive, Google Calendar) attach to it. Built internally first, architected multi-tenant so it can be sold to other agencies later.

**Team size:** 20 users · **Concurrent clients:** 15+ · **Engagement length:** 2–3 months per client.

---

## Tech stack — DO NOT CHANGE WITHOUT ASKING

- **Framework:** Next.js (App Router) + TypeScript
- **Database / Auth / Storage:** Supabase
- **Hosting:** Vercel
- **Styling:** Plain CSS using variables from `styles/design-system.css`. **Do NOT use Tailwind default classes for colors, radii, or fonts.** If you need utility classes for layout, use Tailwind for `flex`, `grid`, `gap`, etc. only — never for color, font, or radius.
- **PDF generation:** `react-pdf` (for invoices, later)
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

### Pattern library
- **Cards:** `background: var(--color-bg-card); border-radius: var(--radius-lg); padding: var(--space-5);` — no border, optional `box-shadow: var(--shadow-sm)`.
- **Primary button:** `<button class="primary">` — already styled in design-system.css.
- **Secondary button:** `<button class="secondary">`.
- **Pills / status badges:** `<span class="pill pill-success">ON TRACK</span>` etc.
- **Page background:** `var(--color-bg-app)` (#F5F5F7) — soft off-white, not pure white.
- **Glass nav bar:** apply `.glass-bar` class for top nav / sticky bars.

---

## ARCHITECTURE DECISIONS — already made, do not relitigate

- **Multi-tenant from day one.** Every database row that isn't a global lookup has a `workspace_id` foreign key. RLS (Row Level Security) policies enforce isolation in Supabase.
- **Tasks have dual tags:** every task belongs to a `project_id` (→ client) AND a `function_tag` (design / marketing / strategy / etc.). UI must support filtering by either.
- **5 roles:** `admin`, `account_lead`, `team_member`, `finance`, `viewer`. Permissions are role-based, not per-user. Encoded in code, not a DB table (for now).
- **No in-app chat.** Slack integration only (read messages via Slack API).
- **No time tracking.** Flat-fee billing.
- **No online payments.** Invoices are PDFs. Payment status is manually marked.
- **Views:** List view first (week 2). Kanban and Calendar come later — same data, different layouts.

---

## ROADMAP — current status

- **Week 1:** ✅ Hello world deployed → Supabase setup → Clients CRUD page
- **Week 2:** ✅ Projects + Tasks tables → List view of tasks with filters
- **Week 3:** ✅ Team members, invite flow, 5 roles + permission gating
- **Week 4:** ✅ Admin dashboard → v1 shipped internally
- **Post-v1:** ✅ Finance module — dashboard, revenue/cost tracking, invoice generator, workspace currency setting

**Current phase:** v1 is live. Finance module is complete. Next: integrations (Slack, Google Drive, Calendar) and any UX fixes from team testing.

Full plan is in `docs/brainstorm.md` — read it once at project start.

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
| **Dashboard** | ✅ Complete | `/dashboard` — stat cards (clients, tasks, projects counts), recent clients, upcoming tasks |
| **Clients** | ✅ Complete | `/dashboard/clients` — list + add/edit modals. `/dashboard/clients/[clientId]` — detail with Overview/Projects tabs, project cards |
| **Tasks** | ✅ Complete | `/dashboard/tasks` — list view + kanban toggle, 5 filter dropdowns, task detail slide-in panel, drag-and-drop status changes |
| **Team** | ✅ Complete | `/dashboard/team` — member list (role management, remove), pending invitations (copy link, revoke) |
| **Finance** | ✅ Complete | `/dashboard/finance` — revenue/cost tracking, per-client P&L, invoices table, recent transactions. `/dashboard/finance/invoice-generator` — full invoice builder with line items, PDF generation, saves to DB |
| **Settings** | ✅ Complete | `/dashboard/settings` — workspace name + currency dropdown (admin only) |
| **Integrations** | ❌ Not started | Slack, Google Drive, Google Calendar — planned for post-v1 |

---

## Database tables (Supabase)

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `workspaces` | Multi-tenant container. Every data row has `workspace_id`. | `id`, `name`, `owner_id`, `currency` (text, default 'USD') |
| `workspace_members` | Links users to workspaces with a role. | `workspace_id`, `user_id`, `role` |
| `clients` | Agency clients. Soft delete via `archived_at`. | `workspace_id`, `name`, `status` (active/paused/completed), `contact_name`, `contact_email`, `contact_phone` |
| `projects` | Belongs to a client. | `workspace_id`, `client_id`, `name`, `status` (planning/active/review/completed/paused), `start_date`, `end_date` |
| `tasks` | Dual-tagged: `project_id` + `function_tag`. | `workspace_id`, `project_id`, `client_id`, `title`, `status` (todo/in_progress/review/done/blocked), `function_tag`, `assignee_id`, `priority`, `position`, `due_date` |
| `invitations` | Pending team invites. | `workspace_id`, `email`, `role`, `token` (UUID), `expires_at`, `accepted_at` |
| `profiles` | User profiles. Auto-created via trigger. | `id` (refs auth.users), `full_name`, `avatar_url` |
| `revenue_entries` | Revenue line items per client. | `workspace_id`, `client_id`, `amount`, `description`, `date` |
| `cost_entries` | Cost line items per client. Client is required (not nullable). | `workspace_id`, `client_id`, `amount`, `category` (ad_spend/freelancer/tools/other), `description`, `date` |
| `invoices` | Invoice records. Status manually updated. | `workspace_id`, `client_id`, `invoice_number`, `amount`, `status` (unpaid/paid/overdue), `due_date`, `paid_date`, `notes` |

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
| `/dashboard` | Server component | Admin dashboard — stats, recent clients, upcoming tasks |
| `/dashboard/clients` | Server + Client | Client list with add/edit modals |
| `/dashboard/clients/[clientId]` | Server + Client | Client detail with breadcrumbs, iOS segmented tabs (Overview / Projects) |
| `/dashboard/tasks` | Server + Client | List + Kanban toggle, 5 filter dropdowns, mobile bottom sheet, task detail slide-in panel |
| `/dashboard/team` | Server + Client | Team member list, pending invitations |
| `/dashboard/finance` | Server + Client | Finance dashboard — stat cards, per-client P&L, invoices table, recent transactions |
| `/dashboard/finance/invoice-generator` | Server + Client | Full invoice builder — line items grid, PDF generation + DB save |
| `/dashboard/settings` | Server + Client | Workspace settings — name, currency (admin only) |

All dashboard routes have `loading.tsx` with shimmer skeletons.

---

## Lib modules

| File | Purpose |
|------|---------|
| `lib/supabase/client.ts` | Browser Supabase client (`createBrowserClient`) |
| `lib/supabase/server.ts` | Server Supabase client (`createServerClient` with cookies) |
| `lib/types.ts` | All shared TypeScript types: `Client`, `Project`, `Task`, `Workspace`, `RevenueEntry`, `CostEntry`, `Invoice`, `InvoiceWithClient`, etc. |
| `lib/permissions.ts` | Role-based permission matrix. 13 permissions across 6 domains. `hasPermission()`, `canSeeNavItem()`. Settings nav gated to admin. |
| `lib/currency.ts` | `getCurrencySymbol(code)`, `formatCurrency(amount, code)`, `formatCurrencyPrecise(amount, code)`. Supports: USD ($), BDT (৳), EUR (€), GBP (£), INR (₹), AED (د.إ). |

---

## Shared components (`components/`)

| Component | Purpose |
|-----------|---------|
| `<ToastProvider>` + `useToast()` | Toast notifications for all success/error actions. Wraps dashboard layout. |
| `<Breadcrumbs>` | Chevron-separated navigation trail. Used on client detail page. |
| `<Skeleton>` + `<PageSkeleton>` | Shimmer loading skeletons matching page content shapes. |
| `<PermissionGate>` | Conditional rendering based on role/permission. |

---

## Permissions system

5 roles: `admin`, `account_lead`, `team_member`, `finance`, `viewer`.

| Permission | admin | account_lead | team_member | finance | viewer |
|------------|-------|--------------|-------------|---------|--------|
| clients:read/write | ✅/✅ | ✅/✅ | ✅/❌ | ✅/❌ | ✅/❌ |
| projects:read/write | ✅/✅ | ✅/✅ | ✅/❌ | ✅/❌ | ✅/❌ |
| tasks:read/write_own/write_all | ✅/✅/✅ | ✅/✅/✅ | ✅/✅/❌ | ✅/❌/❌ | ✅/❌/❌ |
| finance:read/write | ✅/✅ | ❌/❌ | ❌/❌ | ✅/✅ | ❌/❌ |
| team:read/invite/manage | ✅/✅/✅ | ✅/❌/❌ | ✅/❌/❌ | ✅/❌/❌ | ✅/❌/❌ |
| Settings page | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Sidebar navigation

240px fixed sidebar (hamburger on mobile). Nav items: Dashboard, Clients, Tasks, Team, Finance, Settings. Filtered by role. Shows user's full name + email. Sign out at bottom.

---

## Key UI patterns

- **Task detail panel:** Slide-in from right (440px desktop, full screen mobile). Inline editable title/description. Auto-save with debounce.
- **Kanban view:** 5 columns by status. Drag-and-drop to change status. View preference persisted in localStorage.
- **View toggle:** iOS-style segmented control (List | Board) on tasks page.
- **Finance dashboard:** 4 stat cards (revenue, costs, net profit, outstanding). Per-client P&L table. Invoices table with Mark Paid + Download PDF. Recent transactions list.
- **Invoice generator:** Left settings sidebar (language, currency, tax label). Main form: logo upload, billing from/to, meta fields, line items grid (CSS Grid, 7 columns), notes, discount, totals. Generates PDF via `@react-pdf/renderer` and saves to DB.
- **Currency system:** Workspace-level currency stored in `workspaces.currency`. `lib/currency.ts` provides formatting helpers used across all finance pages. No hardcoded `$` anywhere.
- **Page titles:** Each route exports `metadata.title`, root layout uses `%s — Agency OS` template.
- **Toast notifications:** Success/error toasts on all CRUD actions.

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
4. **No RLS policies on finance tables** — `revenue_entries`, `cost_entries`, `invoices` need RLS policies added in Supabase. Currently relying on app-level `workspace_id` filtering only.
5. **No loading skeleton for settings page** — minor, add `app/dashboard/settings/loading.tsx` when convenient.
6. **`workspaces.currency` column** — must be added manually via SQL: `ALTER TABLE public.workspaces ADD COLUMN currency text NOT NULL DEFAULT 'USD';`

---

## Next session starts here

The finance module and currency system are complete. Here's what to build next:

### Immediate priorities
1. **Add RLS policies to finance tables** — `revenue_entries`, `cost_entries`, `invoices` all need workspace isolation RLS. Match the pattern used on `clients`/`projects`/`tasks`.
2. **Add `loading.tsx` to settings route** — simple skeleton, follow existing pattern.
3. **Test finance module end-to-end** — add revenue, add cost, create invoice, mark paid, download PDF, change currency in settings, verify it updates everywhere.

### Next features (post-v1 iteration)
4. **Dashboard enhancements** — add finance summary cards (monthly revenue, outstanding invoices) to the main `/dashboard` page.
5. **Slack integration** — read messages via Slack API, display in a sidebar or dedicated page.
6. **Google Drive integration** — link project folders, show recent files per client.
7. **Google Calendar integration** — show upcoming meetings, sync deadlines.
8. **Reports/export** — monthly P&L report, CSV export of transactions.
9. **Dark mode** — all `var(--color-*)` references are in place, just need to add the alternate values.
