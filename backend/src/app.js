'use strict';

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const compression  = require('compression');
const { FRONTEND_URL, NODE_ENV } = require('./config/env');

// Routes
const authRoutes            = require('./routes/auth.routes');
const customerRoutes        = require('./routes/customer.routes');
const saleRoutes            = require('./routes/sale.routes');
const productRoutes         = require('./routes/product.routes');
const paymentRoutes         = require('./routes/payment.routes');
const dashboardRoutes       = require('./routes/dashboard.routes');
const supplierRoutes        = require('./routes/supplier.routes');
const purchaseRoutes        = require('./routes/purchase.routes');
const supplierPaymentRoutes = require('./routes/supplierPayment.routes');
const shopRoutes            = require('./routes/shop.routes');
const usersRoutes           = require('./routes/users.routes');
const exportRoutes          = require('./routes/export.routes');

const safeDelete = require('./middleware/safeDelete.middleware');

const app = express();

// ── Trust proxy (required for Railway / Heroku) ───────────────────────────────
app.set('trust proxy', 1);

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:4173',   // Vite preview
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many login attempts. Try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/customer-login', authLimiter);

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Safe delete protection ─────────────────────────────────────────────────────
app.use(safeDelete);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Pasal Khata API is running 🏪',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',              authRoutes);
app.use('/api/customers',         customerRoutes);
app.use('/api/sales',             saleRoutes);
app.use('/api/products',          productRoutes);
app.use('/api/payments',          paymentRoutes);
app.use('/api/dashboard',         dashboardRoutes);
app.use('/api/suppliers',         supplierRoutes);
app.use('/api/purchases',         purchaseRoutes);
app.use('/api/supplier-payments', supplierPaymentRoutes);
app.use('/api/shops',             shopRoutes);
app.use('/api/users',             usersRoutes);
app.use('/api/export',            exportRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    errors: [],
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'CORS policy violation', errors: [] });
  }

  // Postgres unique violation
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry. Record already exists.',
      errors: [],
    });
  }

  // Postgres foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record does not exist.',
      errors: [],
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
    errors: [],
  });
});

module.exports = app;
