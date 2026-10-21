import { AsyncLocalStorage } from "node:async_hooks";
import SQLite from "better-sqlite3";
import pg, { type PoolClient } from "pg";
import { attachDatabasePool } from "@vercel/functions";

export type RunResult = { changes: number; lastInsertRowid: number | bigint };
export interface DataStore {
  dialect: "sqlite" | "postgres";
  prepare(sql: string): {
    get(...values: unknown[]): Promise<unknown>;
    all(...values: unknown[]): Promise<unknown[]>;
    run(...values: unknown[]): Promise<RunResult>;
  };
  exec(sql: string): Promise<void>;
  pragma(sql: string): Promise<unknown>;
  transaction<T>(work: () => Promise<T>): () => Promise<T>;
  close(): Promise<void>;
}

export function atomicService<T extends object>(db: DataStore, service: T): T {
  return Object.fromEntries(Object.entries(service).map(([key, method]) => [key,
    (...args: unknown[]) => db.transaction(() => method(...args))()
  ])) as T;
}

// Only translate the SQLite constructs used by this application's queries.
// Values always go through the driver's parameter binding.
export function postgresSql(sql: string): string {
  let result = sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, "BIGSERIAL PRIMARY KEY")
    .replace(/\bINTEGER\b/g, "BIGINT")
    .replace(/username TEXT NOT NULL UNIQUE COLLATE NOCASE/g, "username TEXT NOT NULL")
    .replace(/username\s*=\s*\?\s+COLLATE NOCASE/g, "LOWER(username) = LOWER(?)")
    .replace(/json_extract\((\w+\.\w+),\s*'\$\.(\w+)'\)/g, "(($1::jsonb ->> '$2')::boolean)::int")
    .replace(/\bAS\s+([a-z]+[A-Z]\w*)/g, 'AS "$1"');
  if (/INSERT OR IGNORE/i.test(result)) {
    result = result.replace(/INSERT OR IGNORE/i, "INSERT").replace(/;?\s*$/, " ON CONFLICT DO NOTHING");
  }
  // Preserve SQLite insertion-order tie breakers without depending on physical
  // PostgreSQL row locations. These tables always use named insert columns.
  result = result.replace(/(CREATE TABLE IF NOT EXISTS (?:mf_attempts|dd_attempts)\s*\()/g, "$1 rowid BIGSERIAL UNIQUE,");
  let index = 0, quoted = false;
  return result.replace(/''|'|\?/g, token => {
    if (token === "''") return token;
    if (token === "'") { quoted = !quoted; return token; }
    return quoted ? token : `$${++index}`;
  });
}

export function wrapSqlite(raw: SQLite.Database): DataStore {
  const context = new AsyncLocalStorage<boolean>();
  let tail = Promise.resolve();
  async function exclusive<T>(work: () => T | Promise<T>): Promise<T> {
    if (context.getStore()) return work();
    const previous = tail;
    let release!: () => void;
    tail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try { return await context.run(true, work); } finally { release(); }
  }
  return {
    dialect: "sqlite",
    prepare(sql) {
      return {
        get: (...values) => exclusive(() => raw.prepare(sql).get(...values)),
        all: (...values) => exclusive(() => raw.prepare(sql).all(...values)),
        run: (...values) => exclusive(() => raw.prepare(sql).run(...values))
      };
    },
    exec: sql => exclusive(() => { raw.exec(sql); }),
    pragma: sql => exclusive(() => raw.pragma(sql)),
    transaction: work => async () => {
      if (context.getStore()) return work();
      return exclusive(async () => {
        raw.exec("BEGIN IMMEDIATE");
        try { const value = await work(); raw.exec("COMMIT"); return value; }
        catch (error) { raw.exec("ROLLBACK"); throw error; }
      });
    },
    close: () => exclusive(() => { raw.close(); })
  };
}

export function openPostgres(connectionString: string): DataStore {
  pg.types.setTypeParser(20, Number); // Millisecond timestamps and COUNT are int8.
  const pool = new pg.Pool({ connectionString, max: 5, connectionTimeoutMillis: 15000, idleTimeoutMillis: 10000 });
  if (process.env.VERCEL) attachDatabasePool(pool);
  const context = new AsyncLocalStorage<{ client: PoolClient; tail: Promise<unknown> }>();
  const query = (sql: string, values: unknown[] = []) => {
    const state = context.getStore();
    if (!state) return pool.query(postgresSql(sql), values);
    const pending = state.tail.then(() => state.client.query(postgresSql(sql), values));
    state.tail = pending.then(() => undefined, () => undefined);
    return pending;
  };
  return {
    dialect: "postgres",
    prepare(sql) {
      return {
        get: async (...values) => (await query(sql, values)).rows[0],
        all: async (...values) => (await query(sql, values)).rows,
        run: async (...values) => {
          const serialInsert = /^\s*INSERT\s+INTO\s+(admin_users|audit_log|mf_configurations|dd_config)\b/i.test(sql);
          const result = await query(serialInsert ? `${sql} RETURNING id` : sql, values);
          return { changes: result.rowCount ?? 0, lastInsertRowid: result.rows[0]?.id ?? 0 };
        }
      };
    },
    exec: async sql => { await query(sql); },
    pragma: async () => [],
    transaction: work => async () => {
      if (context.getStore()) return work();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        // The existing engines rely on SQLite's single-writer transactions.
        // Keep that invariant across concurrent serverless instances as well.
        await client.query("SELECT pg_advisory_xact_lock(67241024)");
        const result = await context.run({ client, tail: Promise.resolve() }, work);
        await client.query("COMMIT");
        return result;
      } catch (error) { await client.query("ROLLBACK"); throw error; }
      finally { client.release(); }
    },
    close: () => pool.end()
  };
}
