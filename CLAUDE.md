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

## ROADMAP — current focus

We are building in tiny daily chunks. The current week is the only week that matters.

- **Week 1:** Hello world deployed → Supabase setup → Clients CRUD page
- **Week 2:** Projects + Tasks tables → List view of tasks with filters
- **Week 3:** Team members, invite flow, 5 roles + permission gating
- **Week 4:** Admin dashboard → ship v1 internally

After v1 ships, we use the tool for 1–2 weeks before adding anything new.

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

## Current State

### Database tables (Supabase)
| Table | Purpose |
|-------|---------|
| `workspaces` | Multi-tenant container. Every data row has `workspace_id`. Owner tracked via `owner_id`. |
| `workspace_members` | Links users to workspaces with a role (`admin`, `account_lead`, `team_member`, `finance`, `viewer`). |
| `clients` | Agency clients. Has `status` (active/paused/completed), contact info, `archived_at` for soft delete. |
| `projects` | Belongs to a client. Has `status` (planning/active/review/completed/paused), start/end dates. |
| `tasks` | Belongs to a project + client. Dual-tagged: `project_id` and `function_tag`. Has priority, assignee, due date, position for ordering. |
| `invitations` | Pending team invites. Stores `email`, `role`, `token` (UUID), `expires_at`, `accepted_at`. |
| `profiles` | User profiles. `id` references `auth.users(id)`. Stores `full_name`, `avatar_url`. Auto-created on signup via trigger. |

All tables have RLS policies enforcing workspace isolation. Two triggers on `auth.users`:
- `handle_new_user`: checks invitations → joins existing workspace or creates new one
- `handle_new_profile`: creates a profile row with full_name from signup metadata

### App routes
| Route | Type | Description |
|-------|------|-------------|
| `/` | Server redirect | Sends to `/dashboard` or `/login` |
| `/login` | Client component | Email/password + Google OAuth |
| `/signup` | Client component | Name + email + password, email confirmation |
| `/auth/callback` | Route handler | OAuth code exchange |
| `/dashboard` | Server component | Admin dashboard — stats, recent clients, upcoming tasks. Loading skeleton. |
| `/dashboard/clients` | Server + Client | Client list with add/edit modals. Loading skeleton. |
| `/dashboard/clients/[clientId]` | Server + Client | Client detail with breadcrumbs, iOS segmented tabs (Overview / Projects), project cards. Loading skeleton. |
| `/dashboard/tasks` | Server + Client | List + Kanban toggle. 5 filter dropdowns, mobile bottom sheet. Task detail slide-in panel. Loading skeleton. |
| `/dashboard/team` | Server + Client | Team member list (role management, remove with confirmation), pending invitations (copy link, revoke). Loading skeleton. |
| `/dashboard/finance` | Static placeholder | "Coming after v1 ships" |
| `/accept-invite` | Client component | Public page — validates invite token, accepts invitation, adds user to workspace |

### Permissions system (`lib/permissions.ts`)
Role-based permission matrix with 13 permissions across 6 domains (clients, projects, tasks, finance, team, dashboard).
- `hasPermission(role, permission)` — server-side checks in page.tsx files
- `usePermissions()` hook — client-side checks
- `<PermissionGate>` component — declarative access control in JSX
- Sidebar nav items filtered by role (Finance hidden from non-finance roles)
- Add/Edit buttons gated: clients:write, projects:write, tasks:write_own, team:invite, team:manage

### Shared components (`components/`)
| Component | Purpose |
|-----------|---------|
| `<ToastProvider>` + `useToast()` | Toast notifications for all success/error actions. Wraps dashboard layout. |
| `<Breadcrumbs>` | Chevron-separated navigation trail. Used on client detail page. |
| `<Skeleton>` + `<PageSkeleton>` | Shimmer loading skeletons matching page content shapes. Used via `loading.tsx` in every route. |
| `<PermissionGate>` | Conditional rendering based on role/permission. |

### Sidebar navigation
240px fixed sidebar (hamburger on mobile). Nav items filtered by role. Shows user's full name (from profiles table) + email. Sign out at bottom.

### Key UI patterns
- **Task detail panel:** Slide-in from right (440px desktop, full screen mobile). Inline editable title/description. Auto-save with debounce. Fields grid for status/priority/function/assignee/due date.
- **Kanban view:** 5 columns by status. Drag-and-drop to change status. Cards show title, priority pill, assignee avatar, due date. View preference persisted in localStorage.
- **View toggle:** iOS-style segmented control (List | Board) on tasks page.
- **Page titles:** Each route exports `metadata.title`, root layout uses `%s — Agency OS` template.
- **Page transitions:** Subtle fade-in animation on route changes.
- **Toast notifications:** Success/error/info toasts on all CRUD actions across clients, projects, tasks, invitations.

### Known limitations
- **Invite flow uses shareable links** (copy-paste) instead of email delivery, because we only have the anon key (not service role key).
- **Profiles table SQL must be run manually** in Supabase SQL Editor (profiles table, RLS policies, trigger, backfill).

### Where we stopped
- Week 3–4 complete: permissions, profiles, task detail panel, kanban, UX polish all built.
- v1 is feature-complete for internal launch. Next: deploy to Vercel, test with team for 1–2 weeks, then iterate.
