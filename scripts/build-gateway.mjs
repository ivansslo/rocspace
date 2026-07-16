#!/usr/bin/env node
// Build gateway worker (ESM + HTML loader) for deploy
import { execSync } from 'child_process';
import { join } from 'path';

const cwd = process.cwd();
const distDir = join(cwd, 'workers/gateway/dist');

console.log('🔨 Building gateway worker (ESM + HTML)...');

try {
  execSync(
    `npx esbuild ${join(cwd, 'workers/gateway/src/index.ts')} ` +
    `--bundle --format=esm --target=es2022 ` +
    `--outfile=${join(distDir, 'index.mjs')} ` +
    `--alias:@rocspace/shared=./packages/shared/src/index.ts ` +
    `--loader:.html=text`,
    { stdio: 'inherit', cwd }
  );
  console.log('✅ Gateway built successfully to dist/index.mjs');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
