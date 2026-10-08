# 🌾 Endline 2026 — Survey Progress Dashboard

A clean, **glance-first** dashboard for the **Kharif 2026 Endline Survey**
(KoBoToolbox). In 5 seconds anyone can see **how many farms are surveyed out of
all farms**, broken down by village — tap a village to see exactly which farms
are done and which are still pending.

- **Live from KoBo** — pulls submissions using your KoBo API token.
- **Progress out of the master list** — the denominator (every village + every
  farm) comes straight from the form's own choice lists, so "16 of 232" is real.
- **Village → farms drill-in** — pick a village, see each farm's farmer name,
  enumerator, date, and a 📍 map pin.
- **Enumerator leaderboard, daily momentum, and data-quality checks.**
- **Download** everything as Excel or CSV.
- **MongoDB storage widget** (iPhone-style) in Settings.
- **Built to stay inside Vercel's free Fast-Data-Transfer limit** (see below).

---

## 1) How the data flows (and why it's cheap on Vercel)

```
KoBoToolbox  ──sync──►  MongoDB Atlas  ──aggregate──►  tiny summary (a few KB)  ──►  Browser
```

The browser **never** talks to KoBo directly and never downloads the full
dataset just to draw the dashboard. Instead:

1. A **sync** (manual button, or the daily cron) pulls submissions from KoBo and
   mirrors them into MongoDB.
2. At sync time we **pre-compute a small summary** (per-village counts, leaderboard,
   etc.) and store it.
3. The dashboard reads only that summary, and it is **cached at Vercel's edge** for
   2 minutes (`Cache-Control: s-maxage=120, stale-while-revalidate=600`).

**Result:** most page loads are served from the CDN (≈ a few KB, gzipped) without
running a function or hitting Mongo — so you won't blow through Vercel's free
**origin / Fast Data Transfer** allowance. The big raw export only moves when you
actually click **Download**.

---

## 2) Create the three accounts & connect them

You need three free services. Do them in this order.

### A. MongoDB Atlas (database)
1. Go to **mongodb.com/cloud/atlas** → sign up → **Create a free M0 cluster**
   (pick region **Mumbai / ap-south-1** to match the app's Vercel region).
2. **Database Access** → *Add New Database User* → username + password (save them).
3. **Network Access** → *Add IP Address* → **Allow access from anywhere**
   `0.0.0.0/0` (Vercel's IPs change, so this is required).
4. **Connect → Drivers → Node.js** → copy the connection string. It looks like:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Replace `<password>` with the real password. This is your **`MONGODB_URI`**.

### B. KoBoToolbox (the form data)
1. Log in at **kf.kobotoolbox.org**.
2. Top-right avatar → **Account Settings → Security → API Key**. Copy it — that is
   your **`KOBO_TOKEN`**.
3. The form is already wired up: **`KOBO_FORM = a8moiXkkGSokVURs4yXXg2`**
   (the "Kharif 2026 Endline Survey"). Nothing else to do — the dashboard reads
   the villages, farms and submissions automatically.

> 🔐 The token you shared is in `.env.local` for local testing only. That file is
> **git-ignored and never pushed**. Rotate the key in KoBo whenever you like and
> update it in `.env.local` and in Vercel.

### C. GitHub (the code) + Vercel (hosting)
See the next two sections.

---

## 3) Put it on GitHub

Create an **empty** repo on GitHub (no README/.gitignore). Then, from inside this
folder:

```bash
git init
git add .
git commit -m "Endline 2026 — Level 1"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO>.git
git push -u origin main
```

Already pushed once? For later levels just:

```bash
git add .
git commit -m "Endline 2026 — Level N"
git push
```

> `.env.local` stays on your machine — `.gitignore` keeps your token out of GitHub.

---

## 4) Deploy on Vercel (auto-deploys on every push)

1. Go to **vercel.com** → **Add New… → Project** → import your GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Leave build settings default.
3. **Environment Variables** — add these (Project → Settings → Environment Variables):

   | Key           | Value                                             |
   |---------------|---------------------------------------------------|
   | `MONGODB_URI` | your Atlas connection string                      |
   | `KOBO_TOKEN`  | your KoBo API key                                 |
   | `KOBO_FORM`   | `a8moiXkkGSokVURs4yXXg2`                           |
   | `KOBO_BASE`   | `https://kf.kobotoolbox.org`                      |
   | `CRON_SECRET` | *(optional)* any random string to guard the cron |

4. **Deploy.** First open may take a few seconds while it does the first sync.
5. Every `git push` after this redeploys automatically.

The daily auto-refresh is configured in `vercel.json` (`/api/sync` at 02:00).
You can also hit **Refresh** on the dashboard anytime.

---

## 5) Run it locally (optional)

```bash
npm install
# put your MONGODB_URI into .env.local first
npm run dev
```

Open **http://localhost:3000**. Click **Refresh** to do the first sync.

---

## 6) Downloading the data

Click **Download** on the dashboard:
- **Excel (.xlsx)** — every submission, every field, one row per submission.
- **CSV (.csv)** — same, UTF-8 with BOM so Punjabi/English open cleanly in Excel.

Files are generated on demand from MongoDB and named `endline-2026-YYYY-MM-DD`.

---

## 7) The MongoDB storage widget

**Settings → Database storage** shows a live, iPhone-home-screen-style widget:
how much of your Atlas **512 MB free tier** is used, number of stored
submissions/documents, index size, and last sync — read directly from MongoDB
(`dbStats`). No extra Atlas API keys needed.

---

## 8) Suggestions baked in (from reading your KoBo form)

While wiring this up I noticed a few things in the form and added them:

- **New vs returning farms.** The form branches on `is_returning` (returning farms
  skip tubewell/demographics). The dashboard shows the split and tags **new**
  farms in the village drill-in — useful because new farms take much longer.
- **Enumerator leaderboard** from `name_enu` (decoded to real names).
- **Data checks** panel: duplicate farm IDs, submissions whose `id_farm` isn't in
  the master list, and submissions missing GPS — so you catch issues early.
- **Pending list is actionable.** Each village shows exactly which farmers are
  still to be visited, not just a number — hand it straight to the field team.
- **Map pins** from the `location` geopoint, opened lazily via a Google Maps link
  (no map tiles are loaded, so it adds zero Vercel transfer).

### Ideas for future Levels
- Village/enumerator filters and a search box.
- Target dates & "farms per day needed to finish on time".
- Irrigation analytics (hours/acre by stage) — the form already computes these.
- A light passcode on Download / Refresh if you want to restrict actions.

---

## Tech
Next.js 14 (App Router) · React 18 · MongoDB driver 6 · SheetJS (xlsx) ·
deployed in Vercel's **bom1** (Mumbai) region.
