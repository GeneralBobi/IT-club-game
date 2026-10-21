import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { initializeMythFact } from "./myth-fact/model.js";
import { initializeDetective } from "./digital-detective/model.js";
import { openPostgres, wrapSqlite } from "./database-driver.js";
import { initializeColorCascade } from "./stand-schema.js";

const databasePath = resolve(process.env.DATABASE_PATH ?? "./data/emucon.sqlite");
if (!process.env.DATABASE_URL) mkdirSync(dirname(databasePath), { recursive: true });

export const database = process.env.DATABASE_URL ? openPostgres(process.env.DATABASE_URL) : wrapSqlite(new Database(databasePath));
(await database.pragma("journal_mode = WAL"));
(await database.pragma("foreign_keys = ON"));

async function initialize() {
(await database.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'event_manager', 'volunteer', 'display_operator')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL REFERENCES participants(id),
    game TEXT NOT NULL CHECK (game IN ('zero-point', 'target-rush', 'perfect-align', 'brain-firewall', 'snake', 'myth-fact', 'digital-detective', 'color-cascade')),
    challenger TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    completed_at INTEGER,
    score INTEGER CHECK (score >= 0)
  );
  CREATE INDEX IF NOT EXISTS game_rankings_idx ON game_sessions(game, score DESC, completed_at);
  CREATE INDEX IF NOT EXISTS game_activity_idx ON game_sessions(last_seen_at) WHERE completed_at IS NULL;
`));

// SQLite cannot alter a CHECK constraint. Upgrade existing event databases atomically,
// retaining every session, score and existing extension foreign-key reference.
const gameTable = database.dialect === "sqlite" ? (await database.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'game_sessions'").get()) as { sql: string } : null;
if (gameTable && !gameTable.sql.includes("'digital-detective'")) {
  (await database.pragma("foreign_keys = OFF"));
  try {
    (await database.transaction(async () => {
      (await database.exec(`
      CREATE TABLE game_sessions_upgrade (
        id TEXT PRIMARY KEY,
        participant_id TEXT NOT NULL REFERENCES participants(id),
        game TEXT NOT NULL CHECK (game IN ('zero-point', 'target-rush', 'perfect-align', 'brain-firewall', 'snake', 'myth-fact', 'digital-detective')),
        challenger TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        completed_at INTEGER,
        score INTEGER CHECK (score >= 0)
      );
      INSERT INTO game_sessions_upgrade (id, participant_id, game, challenger, started_at, last_seen_at, completed_at, score)
        SELECT id, participant_id, game, challenger, started_at, last_seen_at, completed_at, score FROM game_sessions;
      DROP TABLE game_sessions;
      ALTER TABLE game_sessions_upgrade RENAME TO game_sessions;
      CREATE INDEX game_rankings_idx ON game_sessions(game, score DESC, completed_at);
      CREATE INDEX game_activity_idx ON game_sessions(last_seen_at) WHERE completed_at IS NULL;
    `));
      if (((await database.pragma("foreign_key_check")) as unknown[]).length) throw new Error("Game migration failed foreign-key integrity check.");
    })());
  } finally { (await database.pragma("foreign_keys = ON")); }
}

(await initializeMythFact(database));
(await initializeDetective(database));
if (database.dialect === "postgres") await database.exec("CREATE UNIQUE INDEX IF NOT EXISTS admin_username_ci ON admin_users (LOWER(username))");
}

if (database.dialect === "postgres") {
  await database.transaction(async () => {
    await database.exec("CREATE TABLE IF NOT EXISTS arena_schema_version (version BIGINT PRIMARY KEY)");
    if (!await database.prepare("SELECT version FROM arena_schema_version WHERE version = 1").get()) {
      await initialize();
      await database.exec("INSERT INTO arena_schema_version VALUES (1)");
    }
  })();
} else await initialize();

// Keep earlier records intact when introducing the shorter stand rules.
if (database.dialect === "postgres") {
  await database.transaction(async () => {
    if (!await database.prepare("SELECT version FROM arena_schema_version WHERE version = 2").get()) {
      await database.exec("ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS rules_version INTEGER NOT NULL DEFAULT 1");
      await database.exec("INSERT INTO arena_schema_version VALUES (2)");
    }
  })();
} else {
  const columns = await database.pragma("table_info(game_sessions)") as {name:string}[];
  if (!columns.some(column=>column.name==="rules_version")) await database.exec("ALTER TABLE game_sessions ADD COLUMN rules_version INTEGER NOT NULL DEFAULT 1");
}
async function initializeStandAttempts(){await database.exec(`CREATE TABLE IF NOT EXISTS stand_attempts (
 id TEXT PRIMARY KEY REFERENCES game_sessions(id), owner TEXT NOT NULL, game TEXT NOT NULL,
 seed TEXT NOT NULL, progress TEXT NOT NULL, deadline INTEGER NOT NULL, completed_at INTEGER, score INTEGER
); CREATE INDEX IF NOT EXISTS stand_attempt_owner ON stand_attempts(owner);`);}
if(database.dialect==="postgres"){
  await database.transaction(async()=>{
    if(!await database.prepare("SELECT version FROM arena_schema_version WHERE version=3").get()){
      await initializeStandAttempts();
      await database.exec("INSERT INTO arena_schema_version VALUES(3)");
    }
  })();
}else await initializeStandAttempts();

if (database.dialect === "postgres") {
  await database.transaction(async () => {
    if (!await database.prepare("SELECT version FROM arena_schema_version WHERE version=4").get()) {
      await initializeColorCascade(database);
      await database.exec("INSERT INTO arena_schema_version VALUES(4)");
    }
  })();
} else await initializeColorCascade(database);

export async function closeDatabase(): Promise<void> {
  (await database.close());
}
