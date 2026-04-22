/**
 * Push variables from a local .env file to Vercel (non-interactive).
 *
 * Usage:
 *   node scripts/vercel-env-push.js [environment ...]
 *
 * Environments: production | preview | development | all
 * Default: production
 *
 * Requires: linked project (`npx vercel link`), logged in CLI or VERCEL_TOKEN.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const envPath = process.env.VERCEL_DOTENV
  ? path.resolve(root, process.env.VERCEL_DOTENV)
  : path.join(root, '.env');

function parseEnvFile(content) {
  const out = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (!key) continue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out.push({ key, value });
  }
  return out;
}

function resolveTargets(argv) {
  const raw = argv.length ? argv : ['production'];
  if (raw.length === 1 && raw[0] === 'all') {
    return ['production', 'preview', 'development'];
  }
  const allowed = new Set(['production', 'preview', 'development']);
  for (const t of raw) {
    if (!allowed.has(t)) {
      console.error(`Unknown environment "${t}". Use: production, preview, development, or all`);
      process.exit(1);
    }
  }
  return raw;
}

if (!fs.existsSync(envPath)) {
  console.error(`Error: env file not found: ${envPath}`);
  process.exit(1);
}

const entries = parseEnvFile(fs.readFileSync(envPath, 'utf8'));
const targets = resolveTargets(process.argv.slice(2));

if (entries.length === 0) {
  console.error('No KEY=value entries found to push.');
  process.exit(1);
}

for (const { key, value } of entries) {
  for (const envName of targets) {
    console.log(`Pushing ${key} → ${envName}...`);
    const r = spawnSync(
      'npx',
      ['vercel', 'env', 'add', key, envName, '--value', value, '-y', '--force'],
      {
        cwd: root,
        stdio: 'inherit',
        env: process.env,
        shell: false,
      },
    );
    if (r.status !== 0) {
      console.error(`Failed: ${key} (${envName}), exit ${r.status}`);
      process.exit(r.status ?? 1);
    }
  }
}

console.log('Finished pushing environment variables.');
