const { Client } = require('pg');
async function test() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgres://localhost/postgres' });
  // wait, the web app connects to Neon. I don't have the env var here directly unless I parse .env.local
}
