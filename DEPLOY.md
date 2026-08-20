# Pasal Khata — Deployment Guide
## Stack: Vercel (frontend) + Render.com (backend) + Supabase (database)

---

## Step 1 — Setup Supabase Database

1. Go to [supabase.com](https://supabase.com) → New project
2. **Region:** Southeast Asia (Singapore) — closest to Nepal
3. **Save your database password** somewhere safe
4. Go to **SQL Editor** → run each migration file in order:
   ```
   migrations/001_create_shops.sql
   migrations/002_create_users.sql
   migrations/003_create_customers.sql
   migrations/004_create_products.sql
   migrations/005_create_sales.sql
   migrations/006_create_sale_items.sql
   migrations/007_create_payments.sql
   migrations/008_create_suppliers.sql
   migrations/009_create_purchases.sql
   migrations/010_create_purchase_items.sql
   migrations/011_create_supplier_payments.sql
   migrations/012_update_products_cost_price.sql
   migrations/014_create_activity_log.sql
   ```
5. Get your **connection string**:
   Supabase → Settings → Database → Connection string → URI
   Example: `postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres`

6. Seed your shop data locally:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env — set DATABASE_URL to your Supabase connection string
   npm run migrate
   npm run seed
   npm run verify    ← copy the Shop ID printed here
   ```

---

## Step 2 — Deploy Backend on Render.com

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. **New +** → **Web Service**
3. Connect GitHub → select `pasal-khata` repository
4. Settings:
   - **Name:** `pasal-khata-backend`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && node src/migrations/run-supabase.js`
   - **Start Command:** `npm start`
   - **Plan:** Free
5. Add **Environment Variables**:
   ```
   NODE_ENV           = production
   DATABASE_URL       = postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
   JWT_SECRET         = (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   JWT_EXPIRES_IN     = 7d
   FRONTEND_URL       = (add after Vercel deploy)
   BACKUP_DIR         = /tmp/backups
   MAX_BACKUPS        = 30
   RENDER_EXTERNAL_URL = https://pasal-khata-backend.onrender.com
   ```
6. Click **Create Web Service** → wait 3–5 minutes
7. **Test:** `https://pasal-khata-backend.onrender.com/health`
   Should return: `{ "status": "ok" }`

---

## Step 3 — Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. **New Project** → Import `pasal-khata` repository
3. **Root Directory:** `pasal-khata`
4. **Framework:** Vite (auto-detected)
5. Add **Environment Variables**:
   ```
   VITE_API_URL  = https://pasal-khata-backend.onrender.com/api
   VITE_SHOP_ID  = (Shop ID from Step 1 — npm run verify)
   ```
6. Click **Deploy** → wait 2–3 minutes
7. Copy your Vercel URL: `https://pasal-khata-xxx.vercel.app`

---

## Step 4 — Connect Frontend URL to Backend

1. Go to **Render** → your service → **Environment**
2. Update: `FRONTEND_URL = https://pasal-khata-xxx.vercel.app`
3. Render auto-redeploys in ~2 minutes

---

## Step 5 — Test Everything

```
Frontend:  https://pasal-khata-xxx.vercel.app
Backend:   https://pasal-khata-backend.onrender.com/health
Login:     ram@rambhandar.com / password123
```

Test flow:
- Login as owner → Dashboard shows data ✅
- Add a customer → appears in list ✅
- Create a sale → stock deducted, baki updated ✅
- Login as customer (phone: 9841111111) → MyKhata shows balance ✅

---

## Costs

| Service   | Plan | Cost      |
|-----------|------|-----------|
| Supabase  | Free | ₨ 0/month |
| Render    | Free | ₨ 0/month |
| Vercel    | Free | ₨ 0/month |
| **Total** |      | **₨ 0**   |

---

## Important Notes

**Render free tier sleeps after 15 minutes of no traffic.**
The keep-alive script pings `/health` every 10 minutes to prevent this.
First request after sleep takes ~30 seconds — users will see a loading spinner.
Upgrade to Render Starter ($7/month) for always-on service.

**Supabase auto-backups daily.** Also run `npm run backup` locally for JSON backups.

**Never commit `.env` files.** All secrets go in Render/Vercel dashboards only.

---

## Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
