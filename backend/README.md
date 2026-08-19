# Pasal Khata — Backend API

Node.js + Express + PostgreSQL REST API for Pasal Khata digital khata system.

## Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 2. Create the database
```sql
CREATE DATABASE pasal_khata;
```

### 3. Install dependencies
```bash
npm install
```

### 4. Configure environment
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
```

### 5. Run migrations
```bash
npm run migrate
```

### 6. Seed demo data
```bash
npm run seed
```
Output shows shop ID and login credentials.

### 7. Start the server
```bash
npm run dev        # development (nodemon)
npm start          # production
```

Server runs on http://localhost:5000

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Register shop + owner |
| POST | `/api/auth/login` | — | Owner/staff login |
| POST | `/api/auth/customer-login` | — | Customer phone login |
| GET  | `/api/auth/me` | Bearer | Current user info |

### Customers
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/api/customers` | owner/staff | List with search + pagination |
| POST | `/api/customers` | owner/staff | Create customer |
| GET  | `/api/customers/:id` | owner/staff/own-customer | Customer profile |
| GET  | `/api/customers/:id/transactions` | owner/staff/own-customer | Khata timeline |
| PUT  | `/api/customers/:id` | owner/staff | Update customer |
| DELETE | `/api/customers/:id` | owner | Delete (blocked if baki > 0) |

### Sales
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/api/sales` | owner/staff | List with filters |
| GET  | `/api/sales/:id` | owner/staff | Sale with items |
| POST | `/api/sales` | owner/staff | Create sale (transactional) |

### Products
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/api/products` | owner/staff | List with search |
| POST | `/api/products` | owner/staff | Create product |
| GET  | `/api/products/:id` | owner/staff | Product detail |
| PUT  | `/api/products/:id` | owner/staff | Update product |
| PATCH | `/api/products/:id/deactivate` | owner | Soft-delete |
| DELETE | `/api/products/:id` | owner | Hard-delete (blocked if sold) |

### Payments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/api/payments` | owner/staff | List with filters |
| POST | `/api/payments` | owner/staff | Record payment (transactional) |

### Dashboard
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET  | `/api/dashboard` | owner/staff | Full dashboard stats |

---

## Response Format

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Paginated:**
```json
{ "success": true, "data": [], "pagination": { "total": 50, "page": 1, "limit": 20, "totalPages": 3 } }
```

**Error:**
```json
{ "success": false, "message": "...", "errors": [] }
```

---

## Demo Credentials (after seed)
- **Owner login:** `ram@rambhandar.com` / `password123`
- **Customer login:** phone `9841111111` + shopId from seed output
