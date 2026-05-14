# Day 1 — Your Exact Prompts for Claude Code

Copy these into Claude Code in order. Do not skip the setup steps.

---

## BEFORE you open Claude Code (15 minutes — you do this manually)

1. **Install Node.js** (v20 or newer) → https://nodejs.org
2. **Sign up for Supabase** → https://supabase.com → create a new project named `agency-os`
3. **Sign up for Vercel** → https://vercel.com (use your GitHub account if you have one)
4. **Create a GitHub account** if you don't have one → https://github.com
5. **Install Claude Code** → follow Anthropic's official install instructions
6. **Make a new empty folder** on your computer called `agency-os` — this will be your project

That's it. The rest is prompts.

---

## PROMPT 1 — Setup (paste this first)

```
I'm building "Agency OS" — an internal operations platform for an education marketing agency.

We're starting from scratch in this empty folder. Please:

1. Initialize a Next.js 14+ project with TypeScript, App Router, and Tailwind CSS in the current directory (use `npx create-next-app@latest . --typescript --app --tailwind --eslint`).
2. Initialize git and make the first commit.
3. Create these folders: `styles/`, `docs/`, `lib/`, `components/`.
4. Create a placeholder `CLAUDE.md` file in the root — I'll paste the real one in next.

Stop after this and wait for me before doing anything else.
```

---

## PROMPT 2 — Paste CLAUDE.md and design system

After Prompt 1 finishes, manually paste these two files I gave you:
- `CLAUDE.md` → into the project root
- `design-system.css` → into `styles/design-system.css`

Then prompt:

```
I've added two files: CLAUDE.md at the root, and styles/design-system.css.

Please:
1. Read both files completely.
2. Update `app/layout.tsx` to import `styles/design-system.css` globally.
3. Update `app/globals.css` — remove the default Tailwind base styles that conflict (default font, default colors). Keep Tailwind layout utilities only.
4. Replace `app/page.tsx` with a minimal "Hello, Agency OS" page using ONLY the design system: SF Pro font, soft rounded card, iOS blue accent button. No Tailwind color classes.
5. Show me a preview of what page.tsx looks like before you change it.

Confirm you've read CLAUDE.md by quoting back the 10 design rules in your response.
```

---

## PROMPT 3 — Connect Supabase

Before this prompt, go to your Supabase project → Settings → API → copy these two values:
- Project URL
- `anon` public key

Then prompt:

```
Now connect Supabase. I'll paste my keys when you tell me where.

1. Install `@supabase/supabase-js` and `@supabase/ssr`.
2. Create `lib/supabase/client.ts` and `lib/supabase/server.ts` following Next.js App Router best practices.
3. Create a `.env.local` file with placeholders for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
4. Add `.env.local` to `.gitignore` if it isn't already.
5. Tell me exactly what to paste where.

Do NOT ask me for the keys — just tell me where to put them and I'll handle it.
```

---

## PROMPT 4 — Deploy to Vercel

```
Time to deploy. Please:

1. Help me push this project to a new GitHub repository named `agency-os`. Walk me through the exact commands.
2. Tell me how to connect this GitHub repo to Vercel for automatic deployment.
3. Remind me to add the Supabase env variables in Vercel's project settings (not just .env.local).

When this is done, I should have a live URL where my "Hello, Agency OS" page is online.
```

---

## After Day 1 ends, you should have:

- ✅ Next.js + TypeScript + Tailwind project running locally
- ✅ Design system locked in (SF Pro, iOS blue, soft rounded, light mode)
- ✅ Supabase connected (database empty, but wired up)
- ✅ Deployed to Vercel — a real `https://agency-os-xxx.vercel.app` URL
- ✅ Git + GitHub set up so every change auto-deploys

**That's a real Day 1.** Looks like nothing visually, but the foundation is correct and every future day builds on this without rework.

---

## Day 2 starts with:

```
Today we add the clients table. Read CLAUDE.md again to refresh context.

In Supabase, I want a `clients` table with: id (uuid, primary), workspace_id (uuid), name (text), contact_email (text), contact_phone (text), status (text — 'active'/'paused'/'completed'), created_at (timestamptz default now()).

Walk me through creating this table in Supabase, then build a /clients page in Next.js that lists all clients in a card grid using the design system. Add a "+ New Client" button that opens a modal form.

I'll handle all the Supabase setup myself — just give me the SQL and step-by-step instructions.
```

---

## How to use these files going forward

- **CLAUDE.md stays in the project root forever.** Update it when you make new architectural decisions.
- **design-system.css is the visual contract.** If you ever want to change a color or font, change it ONCE here — never in components.
- **Every new Claude Code session, start with:** *"Read CLAUDE.md, then [today's task]."* This loads context in 5 seconds.
