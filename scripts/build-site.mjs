#!/usr/bin/env node
// Build site worker (ESM)
import { execSync } from 'child_process';
import { join } from 'path';

const cwd = process.cwd();
const distDir = join(cwd, 'workers/site/dist');

console.log('🔨 Building site worker (ESM)...');

try {
  execSync(
    `npx esbuild ${join(cwd, 'workers/site/src/index.ts')} ` +
    `--bundle --format=esm --target=es2022 ` +
    `--outfile=${join(distDir, 'index.mjs')} ` +
    `--alias:@rocspace/shared=./packages/shared/src/index.ts`,
    { stdio: 'inherit', cwd }
  );
  console.log('✅ Site built successfully to dist/index.mjs');
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
