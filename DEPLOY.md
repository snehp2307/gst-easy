# GST Easy — Deployment Guide

## Quick Start (3 Steps)

### Step 1: Create Supabase Database (Free)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose **Singapore** region (closest to India)
3. Set a strong database password — **save it**
4. Once created, go to **Settings → Database → Connection String → URI**
5. Copy the connection string. It looks like:
   ```
   postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```
6. Change the prefix to `postgresql+asyncpg://`:
   ```
   postgresql+asyncpg://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   ```

### Step 2: Deploy Backend to Render (Free)

1. Push `backend/` to a GitHub repo
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Region**: Singapore
   - **Plan**: Free
5. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your Supabase connection string (with `postgresql+asyncpg://`) |
   | `JWT_SECRET` | (click Generate) |
   | `CORS_ORIGINS` | `["https://your-app.vercel.app"]` |
6. Click **Create Web Service** — it will build and deploy in ~5 min
7. Note your backend URL: `https://gst-easy-api.onrender.com`

### Step 3: Deploy Frontend to Vercel (Free)

1. Push `gst-app/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your GitHub repo
4. Settings:
   - **Root Directory**: `gst-app`
   - **Framework**: Next.js (auto-detected)
5. Add Environment Variable:
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://gst-easy-api.onrender.com/api` |
6. Click **Deploy** — live in ~2 min

---

## After Deployment

### Update CORS on Backend
Once you know your Vercel URL, update the `CORS_ORIGINS` env var on Render:
```
["https://gst-easy.vercel.app"]
```

### Run Migrations (Automatic)
The backend startup script (`start.py`) automatically runs `alembic upgrade head` on every deploy. Tables are created automatically.

### Set Up Cloudflare R2 (Optional — for bill storage)
1. Create a Cloudflare account → **R2 Object Storage**
2. Create bucket named `gst-bills`
3. Create API token → copy Access Key + Secret Key
4. Add to Render env vars: `S3_ENDPOINT_URL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`

---

## Project Structure for GitHub

You can use either one repo (monorepo) or two repos:

### Option A: Monorepo (Recommended)
```
gst-automation/
├── backend/      ← Render deploys this
├── gst-app/      ← Vercel deploys this
└── docs/
```

### Option B: Two Repos
```
gst-easy-api/     ← Render deploys this (copy backend/ contents)
gst-easy-web/     ← Vercel deploys this (copy gst-app/ contents)
```

---

## Costs

| Service | Plan | Cost |
|---------|------|------|
| Supabase (Database) | Free | $0/mo (500MB, 50K requests) |
| Render (Backend) | Free | $0/mo (spins down after 15min idle) |
| Vercel (Frontend) | Hobby | $0/mo (100GB bandwidth) |
| Cloudflare R2 | Free | $0/mo (10GB storage, 10M reads) |
| **Total** | | **$0/month** |

> [!TIP]
> For production with no cold starts, Render Starter plan is $7/mo.
