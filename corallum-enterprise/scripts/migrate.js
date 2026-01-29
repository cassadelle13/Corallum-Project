const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

function required(name) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`${name} is required for migrations`);
  }
  return v;
}

function buildDatabaseUrl() {
  const host = required('DB_HOST');
  const port = required('DB_PORT');
  const database = required('DB_NAME');
  const user = required('DB_USER');
  const password = required('DB_PASSWORD');

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

function run() {
  const cmd = process.argv[2];
  if (!cmd) {
    console.error('Usage: node scripts/migrate.js <up|down|create> [args...]');
    process.exit(2);
  }

  const databaseUrl = buildDatabaseUrl();

  const bin = path.resolve(process.cwd(), 'node_modules', 'node-pg-migrate', 'bin', 'node-pg-migrate.js');
  const args = [bin, cmd];

  if (cmd === 'up' || cmd === 'down') {
    args.push('-m', 'migrations');
  }

  // passthrough extra args (e.g. create <name>)
  args.push(...process.argv.slice(3));

  const result = spawnSync(process.execPath, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl
    }
  });

  process.exit(result.status ?? 1);
}

run();
