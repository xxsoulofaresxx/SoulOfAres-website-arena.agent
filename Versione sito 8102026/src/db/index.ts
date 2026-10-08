import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

/**
 * The fallback keeps Next.js route collection/build-time imports from crashing
 * when a developer has not configured an environment yet. Production still
 * requires DATABASE_URL; without it database requests will fail gracefully in
 * their route-level error handlers.
 */
export const databaseConfigured = Boolean(process.env.DATABASE_URL);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
