# Acadly

A private, role-based college activity-management app — students join
committee "Spaces" via invite codes, get approved by an admin, and manage
calendars, tasks, submissions, and points from one place.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind
- **Auth:** Auth.js (NextAuth) — email/password, JWT sessions
- **Database:** PostgreSQL via Supabase, accessed through Prisma
- **Styling:** custom glassmorphism design system, light/dark via next-themes

New to Supabase? Read **`SETUP.md`** first — it walks through everything
from creating an account to running the app locally to deploying.

## Quickstart

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET — see SETUP.md
npm run db:push
npm run db:seed           # optional: creates a test login + sample space
npm run dev
```

## How authorization works

Every protected API route calls `requireMembership()` or `requireRole()`
from `src/lib/permissions.ts` before touching the database. Role checks are
never done in the UI alone — a hidden button is not a security boundary.
Role hierarchy, low to high:

```
VIEWER < MEMBER < TEAM_LEAD < CORE_ORGANIZER < OWNER
```

`src/lib/permissions.ts` maps each action (approve members, create a task,
review a submission, regenerate an invite code, etc.) to the minimum role it
requires — that file is the single source of truth for "who can do what."

## What's implemented (P0, from the PRD's MVP priority list)

- Registration/login, hashed passwords, JWT sessions
- Create Space / Join Space via invite code / admin approval queue
- Role-based access control, enforced server-side
- Space-scoped calendar (create/list events)
- Task assignment, submission, and server-computed on-time/late/missed status
- Accountability points, computed transactionally so they can't drift from
  submission history
- Submission review (approve / reject / request revision, rating, comments)
- In-app notifications for access requests/approvals, task assignment, and
  submission review
- Audit log for admin actions (approvals, role changes, invite regeneration)
- Light/dark glassmorphism UI

## What's intentionally stubbed / next (P1–P2 from the PRD)

These aren't hard to add, they just need a decision from you first (which
provider, what budget):

- **File uploads** — the schema and `fileId` relations are ready; wire up
  Supabase Storage per the last section of `SETUP.md`.
- **WhatsApp reminders** — `Notification.channel` already supports
  `WHATSAPP`; you need a WhatsApp Business API provider (e.g. Twilio,
  Gupshup, or Meta directly) and a small `lib/whatsapp.ts` sender.
- **Scheduled reminders / missed-task sweeps** — `sweepMissedTasks()` in
  `src/lib/scoring.ts` is written and safe to re-run, but nothing calls it
  yet. Wire it to a Vercel Cron Job (`vercel.json`) hitting a
  `/api/cron/sweep` route once an hour.
- **Email notifications, activity feed, announcements, leaderboards,
  analytics** — deferred per the PRD's own P1/P2 priority.

## Project structure

```
prisma/schema.prisma          all data models
src/lib/permissions.ts        RBAC — read this first
src/lib/scoring.ts            deadline logic + points engine
src/lib/invite-code.ts        invite code generation/hashing
src/app/api/**                backend routes
src/app/(app)/**               authenticated pages (dashboard, spaces, tasks…)
src/components/ui/            glass-card, button, badge primitives
```
