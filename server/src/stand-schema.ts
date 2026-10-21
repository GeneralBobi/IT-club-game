import type { DataStore } from "./database-driver.js";
const allowed =
  "'zero-point', 'target-rush', 'perfect-align', 'brain-firewall', 'snake', 'myth-fact', 'digital-detective', 'color-cascade'";

export async function initializeColorCascade(db: DataStore) {
  if (db.dialect === "postgres") {
    const constraints = (await db
      .prepare(
        "SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid = 'game_sessions'::regclass AND contype = 'c'",
      )
      .all()) as { conname: string; definition: string }[];
    const game = constraints.find((constraint) =>
      constraint.definition.includes("'zero-point'"),
    );
    if (!game || !/^[a-z_][a-z0-9_]*$/.test(game.conname))
      throw new Error("Expected game constraint was not found.");
    if (!game.definition.includes("'color-cascade'"))
      await db.exec(
        `ALTER TABLE game_sessions DROP CONSTRAINT "${game.conname}"; ALTER TABLE game_sessions ADD CONSTRAINT "${game.conname}" CHECK (game IN (${allowed}));`,
      );
    return;
  }
  const table = (await db
    .prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='game_sessions'",
    )
    .get()) as { sql: string };
  if (table.sql.includes("'color-cascade'")) return;
  await db.pragma("foreign_keys = OFF");
  try {
    await db.transaction(async () => {
      await db.exec(`CREATE TABLE game_sessions_color_upgrade (
        id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES participants(id),
        game TEXT NOT NULL CHECK (game IN (${allowed})), challenger TEXT NOT NULL,
        started_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, completed_at INTEGER,
        score INTEGER CHECK (score >= 0), rules_version INTEGER NOT NULL DEFAULT 1
      );
      INSERT INTO game_sessions_color_upgrade (id,participant_id,game,challenger,started_at,last_seen_at,completed_at,score,rules_version)
        SELECT id,participant_id,game,challenger,started_at,last_seen_at,completed_at,score,rules_version FROM game_sessions;
      DROP TABLE game_sessions;
      ALTER TABLE game_sessions_color_upgrade RENAME TO game_sessions;
      CREATE INDEX game_rankings_idx ON game_sessions(game,score DESC,completed_at);
      CREATE INDEX game_activity_idx ON game_sessions(last_seen_at) WHERE completed_at IS NULL;`);
      if (((await db.pragma("foreign_key_check")) as unknown[]).length)
        throw new Error(
          "Color Cascade migration failed its foreign-key integrity check.",
        );
    })();
  } finally {
    await db.pragma("foreign_keys = ON");
  }
}
