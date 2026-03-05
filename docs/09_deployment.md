# Deployment Plan — GST Automation App

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   Vercel     │     │  Railway/   │     │    Neon       │
│  (Frontend)  │────▸│  Render     │────▸│  (Postgres)  │
│   Next.js    │     │  (Backend)  │     │              │
│   Global CDN │     │  NestJS     │     │  Serverless  │
└─────────────┘     └──────┬──────┘     └──────────────┘
                           │
                    ┌──────┴──────┐
                    │ Cloudflare  │
                    │    R2       │
                    │ (Images/    │
                    │  PDFs)      │
                    └─────────────┘
```

---

## Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Local | Development | `localhost:3000` (FE), `localhost:3001` (BE) |
| Staging | Testing & review | `staging.gsteasy.app` |
| Production | Live users | `app.gsteasy.app` |

---

## Hosting & Cost Estimate (Monthly)

| Service | Provider | Plan | Cost |
|---------|----------|------|------|
| Frontend | Vercel | Hobby (free) → Pro ($20) | ₹0–₹1,700 |
| Backend | Railway | Starter ($5) | ₹420 |
| Database | Neon | Free (0.5GB) → Launch ($19) | ₹0–₹1,600 |
| Object Storage | Cloudflare R2 | Free (10GB) → Pay-as-you-go | ₹0–₹500 |
| OCR | Tesseract (self-hosted) | Free | ₹0 |
| Email | SendGrid | Free (100/day) | ₹0 |
| Domain | Cloudflare | `.app` domain | ₹900/year |
| **Total MVP** | | | **₹0–₹420/mo** |
| **Total Scale** | | | **₹2,500–₹5,000/mo** |

---

## CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: gst_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test          # Unit + integration
      - run: npm run test:e2e      # Playwright

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy Backend to Railway
        uses: railway/deploy@v1
        with:
          service: gst-backend-staging
      - name: Deploy Frontend to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-args: '--prod'

  deploy-production:
    needs: deploy-staging
    if: github.ref == 'refs/heads/main' && contains(github.event.head_commit.message, '[release]')
    steps:
      - name: Deploy Backend to Railway (prod)
      - name: Deploy Frontend to Vercel (prod)
      - name: Run DB migrations
      - name: Health check
```

---

## Database Migration Strategy

```
1. Migrations managed by Prisma:
   - npx prisma migrate dev     (local)
   - npx prisma migrate deploy  (staging/prod, CI/CD)

2. Migration rules:
   - Every schema change = new migration file
   - Migrations are forward-only (no rollback in prod; fix-forward)
   - Data migrations in separate scripts, not in schema migrations
   - Test migrations on staging branch first (Neon branching)

3. Backup strategy:
   - Neon automatic daily backups (7-day retention)
   - Weekly pg_dump to R2 (point-in-time recovery)
   - Before production migration: manual snapshot
```

---

## Performance Budget

### Frontend

| Metric | Budget | Tool |
|--------|--------|------|
| First Contentful Paint | < 1.5s (4G), < 3s (3G) | Lighthouse |
| Largest Contentful Paint | < 2.5s (4G) | Lighthouse |
| Total Blocking Time | < 200ms | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| JS bundle per route | < 100KB gzipped | Webpack analyzer |
| CSS total | < 30KB gzipped | PurgeCSS |
| Image (thumbnail) | < 50KB each | Sharp |
| Image (full) | < 200KB, lazy loaded | Sharp |

### Backend

| Metric | Budget | Tool |
|--------|--------|------|
| API p50 latency | < 100ms | Prometheus |
| API p95 latency | < 300ms | Prometheus |
| API p99 latency | < 500ms | Prometheus |
| GST Summary compute | < 200ms | Custom timer |
| OCR processing | < 10s | Custom timer |
| PDF generation | < 3s | Custom timer |
| DB query time | < 50ms per query | Prisma logging |
| Max concurrent connections | 20 (Neon free) | pgbouncer |

### Infrastructure

| Metric | Budget |
|--------|--------|
| Uptime | 99.5% |
| Error rate | < 0.1% |
| Avg response size | < 50KB (API) |
| Cold start (serverless) | < 2s |

---

## Monitoring & Observability

| What | Tool | Cost |
|------|------|------|
| Error tracking | Sentry (free tier) | ₹0 |
| Uptime monitoring | UptimeRobot (free) | ₹0 |
| Performance metrics | Vercel Analytics (free) | ₹0 |
| Logs | Railway built-in | ₹0 |
| DB monitoring | Neon dashboard | ₹0 |

---

## Security Checklist

- [ ] HTTPS everywhere (enforced by Vercel + Railway)
- [ ] HSTS headers
- [ ] CSP headers (Content-Security-Policy)
- [ ] JWT secret in environment variables, never in code
- [ ] Database credentials in environment variables
- [ ] R2 credentials in environment variables
- [ ] Input validation on all API endpoints (Zod)
- [ ] Rate limiting (100 req/min per user)
- [ ] CORS restricted to app domain
- [ ] SQL injection protection (Prisma parameterized)
- [ ] XSS protection (Next.js auto-escaping)
- [ ] File upload type/size validation
- [ ] Audit log with no delete capability
- [ ] Regular dependency security audits (npm audit)

---

## Rollback Plan

```
1. Frontend (Vercel):
   - Instant rollback to previous deployment via Vercel dashboard
   - One click: "Redeploy previous" 

2. Backend (Railway):
   - Rollback via Railway dashboard to previous build
   - Or: git revert + push

3. Database:
   - If migration breaks: Fix-forward with new migration
   - If data corrupted: Restore from Neon point-in-time backup
   - Never rollback migrations in production

4. Rollback decision:
   - Monitor Sentry for spike in errors after deploy
   - If error rate > 1% within 5 min → auto-rollback (v2)
   - If P95 latency > 2x baseline → investigate → manual rollback
```

---

## Launch Checklist

### Week Before Launch
- [ ] All E2E tests passing on staging
- [ ] Security checklist complete
- [ ] Performance budget met (Lighthouse scores)
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring configured
- [ ] Domain DNS configured
- [ ] SSL certificates active
- [ ] Legal: Privacy policy, Terms of service
- [ ] Backup strategy tested

### Launch Day
- [ ] Run database migrations on production
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Health check APIs
- [ ] Smoke test: create invoice, upload bill, check summary
- [ ] Monitor Sentry for 30 minutes
- [ ] Monitor performance for 30 minutes
- [ ] Announce to beta users
