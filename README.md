# पसल खाता — Pasal Khata

Digital Khata System for Nepal 🇳🇵

A bilingual (English + Nepali) shop management system — sales, purchases, customers, suppliers, payments, reports, and data backup.

---

## Tech Stack

| Layer    | Stack                                          |
|----------|------------------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS v4, React Router  |
| Backend  | Node.js, Express 5, PostgreSQL 17              |
| Auth     | JWT, bcryptjs                                  |
| Deploy   | Vercel (frontend) + Railway (backend + DB)     |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/pasal-khata.git
cd pasal-khata
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Setup environment variables
```bash
cp backend/.env.example backend/.env
cp pasal-khata/.env.example pasal-khata/.env
```
Edit both `.env` files with your actual values.

### 4. Setup database & run migrations
```bash
cd backend
npm run migrate
```

### 5. (Optional) Seed demo data
```bash
npm run seed
```

### 6. Get your Shop ID
```bash
npm run verify
```
Copy the Shop ID into `pasal-khata/.env` as `VITE_SHOP_ID`.

### 7. Start development servers
```bash
cd ..
npm run dev
```

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:5173        |
| Backend  | http://localhost:5000        |
| Health   | http://localhost:5000/health |

---

## Deployment

### Backend → Railway
1. Push code to GitHub
2. Create new Railway project → Deploy from GitHub → select `backend/` folder
3. Add Railway PostgreSQL plugin
4. Set environment variables (see `backend/.env.production` for the list)
5. Railway runs `npm run migrate` then `npm start` automatically

### Frontend → Vercel
1. Create new Vercel project → Import from GitHub → select `pasal-khata/` folder
2. Set environment variables:
   - `VITE_API_URL` = your Railway backend URL + `/api`
   - `VITE_SHOP_ID` = your shop UUID from the database
3. Deploy

### After deployment, test:
```
GET  https://your-backend.up.railway.app/health
POST https://your-backend.up.railway.app/api/auth/login
GET  https://your-backend.up.railway.app/api/dashboard
```

---

## Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Backend Scripts

| Command              | Description                  |
|----------------------|------------------------------|
| `npm run dev`        | Start dev server (nodemon)   |
| `npm start`          | Start production server      |
| `npm run migrate`    | Run DB migrations            |
| `npm run seed`       | Seed demo data               |
| `npm run backup`     | Create a JSON backup now     |
| `npm run backup:list`| List all backups             |
| `npm run restore`    | Interactive restore          |
| `npm run verify`     | Read-only DB summary         |
| `npm run cleanup`    | Delete seed/demo data        |

---

## Project Structure

```
pasal-khata/          ← monorepo root
├── backend/          ← Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── scripts/
│   │   └── config/
│   ├── migrations/
│   ├── backups/      ← git-ignored
│   └── railway.json
└── pasal-khata/      ← React + Vite + Tailwind
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   ├── context/
    │   └── utils/
    ├── public/
    │   ├── manifest.json
    │   └── sw.js
    └── vercel.json
```

---

## Security Notes
- Never commit `.env` or `.env.production` files
- Never commit the `backups/` folder
- JWT_SECRET must be at least 32 random characters
- Rate limiting: 500 req/15min general, 20 req/15min on login routes
