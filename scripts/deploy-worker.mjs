#!/usr/bin/env node
// Deploy a worker to Cloudflare Workers API
// Usage: node deploy-worker.mjs <worker-name> [--esm]
// Worker name mapping: gateway → hermes-cloudflare, site → roc-site
// --esm: Deploy as ESM module via multipart upload

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const CFAT = process.env.CF_API_TOKEN || '';
const ACCOUNT_ID = '37c44b4d3f192a627d20e46bdf910e79';

// Worker name → CF script name mapping
const WORKER_MAP = {
  'site': 'roc-site',
  'gateway': 'hermes-cloudflare',
  'auth': 'openauth-certve',
  'webhook': 'hermes-webhook',
};

let workerArg = process.argv[2];
const esmFlag = process.argv.includes('--esm');

if (!workerArg) {
  console.error('Usage: node deploy-worker.mjs <worker-name> [--esm]');
  console.error('Available: site, gateway, auth, webhook');
  process.exit(1);
}

const cfName = WORKER_MAP[workerArg] || workerArg;
const workerDir = join(process.cwd(), 'workers', workerArg);
const distFile = join(workerDir, 'dist', 'index.mjs');

// Build first
console.log(`🔨 Building ${workerArg}...`);
try {
  const aliasMap = workerArg === 'gateway'
    ? '--alias:@rocspace/shared=./packages/shared/src/index.ts'
    : workerArg === 'site'
    ? '--alias:@rocspace/shared=./packages/shared/src/index.ts'
    : '';

  const loaderArgs = workerArg === 'gateway' ? '--loader:.html=text' : '';
  execSync(
    `npx esbuild ${join(workerDir, 'src/index.ts')} --bundle --format=esm --target=es2022 ` +
    `--outfile=${distFile} ${aliasMap} ${loaderArgs}`,
    { stdio: 'inherit', cwd: process.cwd() }
  );
} catch {
  console.error('❌ Build failed');
  process.exit(1);
}

if (!existsSync(distFile)) {
  console.error(`❌ Build output not found: ${distFile}`);
  process.exit(1);
}

const script = readFileSync(distFile, 'utf-8');
console.log(`📦 Deploying ${workerArg} → ${cfName} (${(script.length / 1024).toFixed(1)}KB, ESM)...`);

// ESM multipart upload
const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
const metadata = JSON.stringify({
  main_module: 'index.js',
  compatibility_date: '2024-12-01',
  bindings: [],
});

const body =
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="metadata"\r\n` +
  `Content-Type: application/json\r\n\r\n` +
  `${metadata}\r\n` +
  `--${boundary}\r\n` +
  `Content-Disposition: form-data; name="index.js"; filename="index.js"\r\n` +
  `Content-Type: application/javascript+module\r\n\r\n` +
  `${script}\r\n` +
  `--${boundary}--\r\n`;

const resp = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${cfName}`,
  {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${CFAT}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  },
);

const data = await resp.json();
if (data.success) {
  console.log(`✅ ${cfName} deployed | tag: ${data.result?.tag?.slice(0, 8)}... | ESM module`);
} else {
  console.error(`❌ Deploy failed:`, JSON.stringify(data.errors));
  process.exit(1);
}
