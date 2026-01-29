const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const { Client } = require('pg');

function required(name) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is missing`);
  return v;
}

(async () => {
  const host = required('DB_HOST');
  const port = required('DB_PORT');
  const database = required('DB_NAME');
  const user = required('DB_USER');
  const password = required('DB_PASSWORD');

  const url = `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  console.log('DATABASE_URL =', url.replace(/:\/\/[^:]+:[^@]+@/, '://<user>:<pass>@'));

  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const r = await client.query('select current_database() as db, current_user as usr');
    console.log('CONNECTED:', r.rows[0]);
  } catch (e) {
    console.error('CONNECT_FAIL:', e.message);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch {}
  }
})();
