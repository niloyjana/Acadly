# Setting up Acadly with Supabase

This walks through everything from zero — you don't need to know Supabase already.

## What Supabase actually is, for this project

Supabase is a hosted Postgres database with some extras bolted on (file storage,
auth, realtime). Acadly only uses **two** parts of it for now:

1. **The Postgres database** — this is what actually stores your users, spaces,
   tasks, etc. Prisma (the code in `prisma/schema.prisma`) talks to this directly.
2. **Storage** — for file uploads (posters, PDFs) in Phase 2. You can skip this
   at first and add it later without touching anything else.

You are **not** using Supabase's own Auth or its auto-generated API — Acadly
has its own login system (Auth.js) and its own API routes (Next.js). Supabase
is just your database host, similar to how you'd use any managed Postgres.

## 1. Create a Supabase project

1. Go to https://supabase.com and sign up (GitHub login is fastest).
2. Click **New project**.
3. Pick an organization (it creates a default one for you), name the project
   `acadly`, and set a **database password** — write this down somewhere safe,
   you'll need it in a second.
4. Pick the region closest to your users (e.g. Mumbai/Singapore if this is for
   a college in India) and click **Create new project**. Wait ~2 minutes while
   it provisions.

## 2. Get your connection strings

1. Inside the project, click the **Connect** button near the top of the dashboard
   (or go to Project Settings → Database).
2. You'll see a few connection string options. Acadly needs **two**:
   - **Transaction pooler** (port 6543) — this is your `DATABASE_URL`. The app
     uses this at runtime; pooled connections handle many short-lived requests
     well, which is what a web app does.
   - **Direct connection** (port 5432) — this is your `DIRECT_URL`. Prisma uses
     this only when running migrations, because migrations need a session that
     isn't pooled.
3. Copy both, replacing `[YOUR-PASSWORD]` in the string with the database
   password you set in step 1.

## 3. Configure the project locally

```bash
cd acadly
npm install
cp .env.example .env
```

Open `.env` and paste in:
- `DATABASE_URL` — the pooled connection string
- `DIRECT_URL` — the direct connection string
- `NEXTAUTH_SECRET` — generate one with `openssl rand -base64 32` (or any
  random 32+ character string)
- `NEXTAUTH_URL` — leave as `http://localhost:3000` for local dev

## 4. Create the tables

This pushes everything in `prisma/schema.prisma` into your Supabase database:

```bash
npm run db:generate   # generates the typed Prisma client
npm run db:push       # creates the actual tables in Supabase
```

Go back to the Supabase dashboard → **Table Editor** — you should now see
`User`, `Space`, `Task`, `SpaceMember`, etc.

(Once you're past the prototype stage, switch `db:push` for
`npm run db:migrate` — it does the same thing but keeps a migration history
in `prisma/migrations/`, which you want before this touches real user data.)

## 5. (Optional) Seed some test data

```bash
npm run db:seed
```

This creates two test users and a sample "Farewell 2026" space so you have
something to click around immediately. It prints a login (email +
`password123`) and an invite code to your terminal.

## 6. Run it

```bash
npm run dev
```

Visit http://localhost:3000, log in with the seeded account (or register a
new one), and you should land on the dashboard.

## 7. Deploying (Vercel)

1. Push this repo to GitHub.
2. Go to https://vercel.com → **New Project** → import the repo.
3. In the project's **Environment Variables**, paste in the same values from
   your `.env` (but set `NEXTAUTH_URL` to your real deployed URL, e.g.
   `https://acadly.vercel.app`).
4. Deploy. Vercel runs `npm run build`, which includes `prisma generate`
   automatically via the `postinstall` hook (already wired in
   `package.json`) — no extra migration step needed since you already ran
   `db:push` against the same Supabase database.

## Adding Supabase Storage later (file uploads, PRD §20 & §33)

When you're ready for real file uploads instead of just notes on
submissions:

1. In Supabase, go to **Storage** → **New bucket**, call it `acadly-files`,
   and mark it **private** (not public) — files should only be reachable
   through your app, not a guessable public URL.
2. Copy your **Project URL** and **anon key** from Project Settings → API
   into `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the
   **service role key** into `SUPABASE_SERVICE_ROLE_KEY` (server-side only —
   never expose this one to the browser).
3. Add an `/api/files` route that: accepts an upload, asks Supabase Storage
   for a signed upload URL using the service role key, and writes a row to
   the `FileAsset` table with the returned `storageKey`. The `Submission`
   and `Task` models already have the `fileId` relation wired up to receive
   this.

## Common errors and what they mean

- **"Can't reach database server"** — your `DATABASE_URL` password is wrong,
  or you're missing `?pgbouncer=true` on the pooled URL.
- **"prepared statement already exists"** — you're using the pooled URL for
  migrations. Migrations (`db:push`, `db:migrate`) must use `DIRECT_URL`
  (already configured in `schema.prisma`, so this shouldn't happen unless
  the env var is missing).
- **NextAuth "no secret" warning** — `NEXTAUTH_SECRET` isn't set.
