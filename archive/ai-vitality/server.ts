import express from 'express';
import fs from 'fs';
import path from 'path';
import vm from 'vm';

// Inline .env loader to load local environment secrets
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        // Remove surrounding quotes if present
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  console.warn('Could not load .env file:', e);
}

// Setup global variables for the worker
const envKeys = [
  'GITHUB_PAT',
  'OWNER_GITHUB',
  'TOKEN',
  // AI Model Keys
  'GEMINI_KEY',
  'GEMINI_API_KEY',
  'GROQ_KEY',
  'OR_KEY',
  'OR_PROV_KEY',
  'DEEPSEK_API_KEY',
  'X_GOOG_API_KEY',
  'CF_AI_TOKEN',
  'CF_TOKEN',
  'CF_ACCOUNT',
  // Claw / Notion
  'CLAW_KEY',
  'CLAWLINK_KEY',
  'CLAWHUB_KEY',
  // Clerk Auth
  'CLERK_PK',
  'CLERK_SK',
  'CLERK_SECRET_KEY',
  // Solace PubSub+
  'SOLACE_URL',
  'SOLACE_USER',
  'SOLACE_PASS',
  'SOLACE_API_TOKEN',
  'SOLACE_SEMP_URL',
  'SOLACE_VIEW_USER',
  'SOLACE_VIEW_PASS',
  // Database
  'MONGO_URI',
  'MONGODB_URI',
  'SQL_DB_NAME',
  // Tailscale
  'TAILSCALE_KEY',
  // Honcho
  'HONCHO_KEY',
  // App Config
  'APP_URL',
  'DOMAIN',
];

for (const key of envKeys) {
  let val = process.env[key] || '';
  // Gemini fallback chain
  if (key === 'GEMINI_KEY' && !val) {
    val = process.env.GEMINI_API_KEY || process.env.X_GOOG_API_KEY || '';
  }
  if (key === 'GEMINI_API_KEY' && !val) {
    val = process.env.GEMINI_KEY || '';
  }
  // Fix: CLERK_SECRET_KEY must be secret key (sk_*), not public key (pk_*)
  if (key === 'CLERK_SECRET_KEY') {
    if (!val || val.startsWith('pk_')) {
      val = process.env.CLERK_SK || '';
    }
  }
  // MongoDB fallback
  if (key === 'MONGO_URI' && !val) {
    val = process.env.MONGODB_URI || '';
  }
  if (key === 'MONGODB_URI' && !val) {
    val = process.env.MONGO_URI || '';
  }
  (global as any)[key] = val;
}

// Load and expose Firebase Applet Config globally
try {
  const fbPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(fbPath)) {
    (global as any).FIREBASE_CONFIG = JSON.parse(fs.readFileSync(fbPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load firebase-applet-config.json:', e);
}

// Mock the LOGS KV store in memory for live activity logs
const logsMap = new Map<string, string>();
(global as any).LOGS = {
  put: async (key: string, value: string, options?: any) => {
    logsMap.set(key, value);
  },
  get: async (key: string, format?: string) => {
    return logsMap.get(key) || null;
  },
  list: async (options?: { limit?: number }) => {
    const keys = Array.from(logsMap.keys()).map(k => ({ name: k }));
    const limit = options?.limit || 1000;
    return {
      keys: keys.slice(0, limit),
      list_complete: true,
    };
  }
};

// Capture the Cloudflare Worker fetch listener
let registeredListener: ((event: any) => void) | null = null;
(global as any).addEventListener = (type: string, listener: any) => {
  if (type === 'fetch') {
    registeredListener = listener;
  }
};

// Load and run worker.js in the current global context
try {
  const workerPath = path.join(process.cwd(), 'cloudflare-gateway', 'worker.js');
  const workerCode = fs.readFileSync(workerPath, 'utf8');
  vm.runInThisContext(workerCode, { filename: 'worker.js' });
  console.log('Successfully loaded and evaluated cloudflare-gateway/worker.js');
} catch (err) {
  console.error('Error evaluating worker.js:', err);
  process.exit(1);
}

// Initialize Express server
const app = express();
const PORT = 3000;

// Use raw body parser for all requests to accurately capture the exact payloads
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Helper to recursively list files in the workspace (excluding huge directories)
app.get('/api/file-list', (req, res) => {
  try {
    const listFilesRecursive = (dir: string, fileList: string[] = []): string[] => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === '.npm-cache') continue;
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          listFilesRecursive(filePath, fileList);
        } else {
          fileList.push(path.relative(process.cwd(), filePath));
        }
      }
      return fileList;
    };
    const filesList = listFilesRecursive(process.cwd());
    res.json({ files: filesList });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ZIP Extraction Endpoint
app.post('/api/extract-zip', async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      res.status(400).json({ error: 'Please upload or provide a valid ZIP archive' });
      return;
    }

    const tempZipPath = path.join(process.cwd(), 'temp-upload.zip');
    fs.writeFileSync(tempZipPath, req.body);

    console.log(`Saved temporary ZIP file of size ${req.body.length} bytes to ${tempZipPath}. Extracting...`);

    // Extract using standard Linux unzip
    const { execSync } = await import('child_process');
    execSync(`unzip -o "${tempZipPath}" -d .`, { stdio: 'inherit' });

    // Clean up temporary file
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }

    // Also reload env variables first if .env was extracted
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        for (const line of envContent.split('\n')) {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            const key = match[1];
            let val = match[2] || '';
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
            process.env[key] = val;
            (global as any)[key] = val;
          }
        }
        console.log('Successfully reloaded env variables after ZIP extraction');
      }
    } catch (envErr: any) {
      console.warn('Env reload warning:', envErr.message);
    }

    // Try to reload worker.js in case it was updated
    try {
      const workerPath = path.join(process.cwd(), 'cloudflare-gateway', 'worker.js');
      if (fs.existsSync(workerPath)) {
        const workerCode = fs.readFileSync(workerPath, 'utf8');
        vm.runInThisContext(workerCode, { filename: 'worker.js' });
        console.log('Successfully reloaded worker.js after ZIP extraction');
      }
    } catch (reloadErr: any) {
      console.warn('Worker reload warning:', reloadErr.message);
    }

    res.json({
      success: true,
      message: 'ZIP archive extracted successfully! Files inside the workspace have been updated and reloaded.'
    });
  } catch (err: any) {
    console.error('ZIP extraction failed:', err);
    res.status(500).json({ error: `ZIP extraction failed: ${err.message}` });
  }
});

// API endpoint to save chat messages
import { getFirestore } from './firebase-admin.js';
import admin from 'firebase-admin';
app.post('/api/save-chat', express.json(), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }
    const db = getFirestore();
    await db.collection('chats').add({
      ...message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error saving chat message:', err);
    res.status(500).json({ error: err.message });
  }
});

// Handle all routes through our Express-to-Worker bridge
app.all('*', async (req, res) => {
  if (!registeredListener) {
    res.status(500).send('Worker fetch listener not registered');
    return;
  }

  try {
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host') || `localhost:${PORT}`;
    const url = `${protocol}://${host}${req.originalUrl}`;
    const method = req.method;

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (Array.isArray(val)) {
        for (const v of val) {
          if (v) headers.append(key, v);
        }
      } else if (val) {
        headers.set(key, val);
      }
    }

    // Set client IP header
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
    if (!headers.has('cf-connecting-ip')) {
      headers.set('cf-connecting-ip', ip);
    }

    let body: any = undefined;
    if (method !== 'GET' && method !== 'HEAD' && Buffer.isBuffer(req.body) && req.body.length > 0) {
      body = req.body;
    }

    const fetchReq = new Request(url, {
      method,
      headers,
      body: body as any,
    });

    // Attach Cloudflare-specific metadata
    (fetchReq as any).cf = {
      colo: 'NodeJS',
      country: 'US',
    };

    let responsePromise: Promise<any> | null = null;
    const event = {
      request: fetchReq,
      respondWith(promise: Promise<any>) {
        responsePromise = promise;
      }
    };

    // Invoke captured fetch listener
    registeredListener(event);

    if (!responsePromise) {
      res.status(500).send('Worker did not call respondWith');
      return;
    }

    const fetchRes = (await responsePromise) as any;

    // Set Express status code
    res.status(fetchRes.status);

    // Copy fetch headers to Express response
    fetchRes.headers.forEach((val: string, key: string) => {
      if (key.toLowerCase() !== 'content-encoding') {
        res.setHeader(key, val);
      }
    });

    // Handle streaming vs buffering body
    if (fetchRes.body) {
      const reader = fetchRes.body.getReader();
      res.on('close', () => {
        reader.cancel().catch(() => {});
      });

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
        }
      } catch (streamErr) {
        console.error('Error during streaming response:', streamErr);
      } finally {
        res.end();
      }
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error('Error handling request in Express-to-Worker bridge:', err);
    res.status(500).send(`Express-to-Worker bridge error: ${err.message}`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Solace Hermes server running on http://localhost:${PORT}`);
});
