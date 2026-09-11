const fs = require('fs');
const path = require('path');
const { loadEnv } = require('./config/env');
loadEnv();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { ensureDemoData } = require('./config/demo-data');

const authRoutes = require('./routes/auth.routes');
const sosRoutes = require('./routes/sos.routes');
const alertRoutes = require('./routes/alert.routes');
const resourceRoutes = require('./routes/resource.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const supplyRoutes = require('./routes/supply.routes');
const aiRoutes = require('./routes/ai.routes');
const assistantRoutes = require('./routes/assistant.routes');
const intelRoutes = require('./routes/intel.routes');
const globalIntelRoutes = require('./routes/global-intel.routes');

const noOpIo = {
  emit() {},
  to() {
    return this;
  },
};

const isAllowedOrigin = (origin, allowedOrigins) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

const allowedOrigins = Array.from(
  new Set(
    [
      process.env.CLIENT_URL,
      process.env.CORS_ORIGIN,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ].filter(Boolean)
  )
);

const corsOptions = {
  origin(origin, callback) {
    if (
      process.env.CORS_ORIGIN === '*' ||
      allowedOrigins.includes('*') ||
      isAllowedOrigin(origin, allowedOrigins)
    ) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

let bootstrapPromise;

const ensureBackendReady = async () => {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await connectDB();
      await ensureDemoData();
    })().catch((error) => {
      bootstrapPromise = null;
      throw error;
    });
  }

  return bootstrapPromise;
};

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'ReliefOS API route is reachable.',
  });
});

app.get('/api/diagnostics', (_req, res) => {
  const mongoValue = process.env.MONGO_URI?.trim() || process.env.MONGODB_URI?.trim() || '';
  const mongoConfigured = Boolean(mongoValue && !mongoValue.includes('<'));
  const jwtConfigured = Boolean(process.env.JWT_SECRET?.trim());
  const missing = [
    !mongoConfigured ? 'valid MONGO_URI or MONGODB_URI' : null,
    !jwtConfigured ? 'JWT_SECRET' : null,
  ].filter(Boolean);

  res.status(missing.length ? 503 : 200).json({
    status: missing.length ? 'misconfigured' : 'ok',
    env: {
      mongoConfigured,
      mongoEnvName: process.env.MONGO_URI?.trim()
        ? 'MONGO_URI'
        : process.env.MONGODB_URI?.trim()
          ? 'MONGODB_URI'
          : null,
      mongoDbName: process.env.MONGO_DB_NAME?.trim() || 'reliefos',
      jwtConfigured,
    },
    missing,
    route: '/api/[...path].js',
    mongoRequiredFor: ['/api/auth/login', '/api/auth/register'],
  });
});

app.use(async (req, res, next) => {
  try {
    await ensureBackendReady();
    req.io = req.app.locals.io || noOpIo;
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/supply', supplyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/intel', intelRoutes);
app.use('/api/global-intel', globalIntelRoutes);

// Static client assets (for single-container Docker / production deployments)
const candidateDistPaths = [
  path.resolve(__dirname, 'dist'),
  path.resolve(__dirname, '../dist'),
  path.resolve(process.cwd(), 'dist'),
];
const distPath = candidateDistPaths.find((candidate) => fs.existsSync(candidate));

if (distPath) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((error, _req, res, _next) => {
  console.error('API runtime error:', error);
  const isConfigError =
    error.message?.includes('Missing required environment variable') ||
    error.message?.includes('Missing MongoDB connection string');

  res.status(isConfigError ? 503 : 500).json({
    message: isConfigError
      ? error.message
      : 'Server error',
  });
});

module.exports = { app, ensureBackendReady, allowedOrigins, corsOptions };
