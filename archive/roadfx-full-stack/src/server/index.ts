/**
 * ROADFX Full Stack - Express Server
 * Integrates with existing CF Workers + Firebase + Solace
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Routes
import aiRoutes from '../routes/ai.js';
import solaceRoutes from '../routes/solace.js';
import crewaiRoutes from '../routes/crewai.js';
import webhookRoutes from '../routes/webhook.js';
import healthRoutes from '../routes/health.js';

// Load environment
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Existing CF Workers (DO NOT create new ones)
const WORKERS = {
  gateway: 'https://hermes-cloudflare.certveis.workers.dev',
  webhook: 'https://hermes-webhook.certveis.workers.dev',
  backup: 'https://certve-webhook.certveis.workers.dev',
  cfai: 'https://cf-ai.certveis.workers.dev',
  links: 'https://rocspace-links.certveis.workers.dev',
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Worker Config Endpoint ──
app.get('/api/workers', (req, res) => {
  res.json({
    workers: WORKERS,
    status: 'Using existing Cloudflare Workers — no new workers created',
    endpoints: {
      chat: `${WORKERS.gateway}/chat`,
      api: `${WORKERS.gateway}/api`,
      models: `${WORKERS.gateway}/v1/models`,
      solace: `${WORKERS.gateway}/solace/status`,
      crew: `${WORKERS.gateway}/crew`,
      crawl: `${WORKERS.gateway}/crawl4ai`,
      zapier: `${WORKERS.gateway}/zapier`,
      logs: `${WORKERS.gateway}/logs`,
      dashboard: `${WORKERS.gateway}/dashboard`,
      links: WORKERS.links,
      cfai: WORKERS.cfai,
    }
  });
});

// ── Firebase Config Endpoint ──
app.get('/api/firebase-config', (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-config.json');
    if (fs.existsSync(configPath)) {
      res.json(JSON.parse(fs.readFileSync(configPath, 'utf8')));
    } else {
      res.json({
        apiKey: process.env.FIREBASE_API_KEY || '',
        authDomain: `${process.env.FIREBASE_PROJECT_ID || 'planning-with-ai-36675'}.firebaseapp.com`,
        projectId: process.env.FIREBASE_PROJECT_ID || 'planning-with-ai-36675',
        storageBucket: `${process.env.FIREBASE_PROJECT_ID || 'planning-with-ai-36675'}.firebasestorage.app`,
        messagingSenderId: '877262776320',
        appId: '1:877262776320:web:a7e1a234879e66080210e5'
      });
    }
  } catch (e) {
    res.status(500).json({ error: 'Failed to load Firebase config' });
  }
});

// ── Chat Save (Firebase Firestore) ──
app.post('/api/save-chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    // Try Firebase, fallback to local log
    try {
      const { saveChatMessage } = await import('../services/firebase.js');
      const result = await saveChatMessage(message);
      res.json(result);
    } catch (fbErr: any) {
      // Fallback: log locally
      console.log('[Chat Saved Locally]', JSON.stringify(message));
      res.json({ status: 'saved_local', note: 'Firebase not available: ' + fbErr.message });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Chat History (Firebase Firestore) ──
app.get('/api/chat-history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const { getChatHistory } = await import('../services/firebase.js');
    const history = await getChatHistory(limit);
    res.json({ messages: history });
  } catch (err: any) {
    res.json({ messages: [], note: 'Firebase not available: ' + err.message });
  }
});

// ── Proxy to Hermes Gateway ──
app.all('/gateway/*', async (req, res) => {
  try {
    const targetPath = req.path.replace('/gateway', '');
    const url = `${WORKERS.gateway}${targetPath}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (process.env.TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.TOKEN}`;
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(502).json({ error: 'Gateway proxy error: ' + err.message });
  }
});

// ── API Routes ──
app.use('/api/ai', aiRoutes);
app.use('/api/solace', solaceRoutes);
app.use('/api/crewai', crewaiRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api', healthRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 ROADFX Full Stack Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Workers: http://localhost:${PORT}/api/workers`);
  console.log(`   Firebase: http://localhost:${PORT}/api/firebase-config`);
  console.log(`   Gateway Proxy: http://localhost:${PORT}/gateway/chat`);
  console.log(`\n   Using EXISTING CF Workers:`);
  Object.entries(WORKERS).forEach(([k, v]) => console.log(`     ${k}: ${v}`));
  console.log('');
});

export default app;
