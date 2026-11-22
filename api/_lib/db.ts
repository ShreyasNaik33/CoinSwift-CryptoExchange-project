import { Pool } from 'pg';

let pool: Pool | undefined;
let schemaPromise: Promise<void> | undefined;

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    pool.on('error', (error) => console.error('Unexpected PostgreSQL pool error', error));
  }
  return pool;
}

export async function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const db = getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          name VARCHAR(80) NOT NULL,
          email VARCHAR(254) NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS accounts (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          cash_cents BIGINT NOT NULL DEFAULT 1000000 CHECK (cash_cents >= 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS holdings (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          asset_id VARCHAR(32) NOT NULL,
          quantity NUMERIC(30, 12) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
          PRIMARY KEY (user_id, asset_id)
        );

        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          side VARCHAR(4) NOT NULL CHECK (side IN ('BUY', 'SELL')),
          asset_id VARCHAR(32) NOT NULL,
          symbol VARCHAR(12) NOT NULL,
          quantity NUMERIC(30, 12) NOT NULL CHECK (quantity > 0),
          unit_price NUMERIC(20, 8) NOT NULL,
          total_cents BIGINT NOT NULL CHECK (total_cents > 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at DESC);

        CREATE TABLE IF NOT EXISTS wallet_activity (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          action VARCHAR(10) NOT NULL CHECK (action IN ('DEPOSIT', 'WITHDRAW')),
          amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
}
