import { describe, expect, it } from "vitest";
import SQLite from "better-sqlite3";
import { postgresSql, wrapSqlite } from "./database-driver.js";

describe("Postgres query compatibility", () => {
  it("binds values without replacing question marks inside literals", () => {
    expect(postgresSql("SELECT '?' AS punctuation, 'can''t?' AS literal WHERE id = ?")).toBe("SELECT '?' AS punctuation, 'can''t?' AS literal WHERE id = $1");
  });
  it("preserves API alias casing, JSON visibility and case insensitive usernames", () => {
    expect(postgresSql("SELECT completed_at AS completedAt WHERE username = ? COLLATE NOCASE")).toContain('AS "completedAt" WHERE LOWER(username) = LOWER($1)');
    expect(postgresSql("json_extract(a.config,'$.leaderboardVisible')=1")).toBe("((a.config::jsonb ->> 'leaderboardVisible')::boolean)::int=1");
    expect(postgresSql("INSERT OR IGNORE INTO participants VALUES (?, ?)")).toBe("INSERT INTO participants VALUES ($1, $2) ON CONFLICT DO NOTHING");
  });
});

describe("asynchronous SQLite compatibility", () => {
  it("rolls back an asynchronous transaction including nested operations", async () => {
    const db = wrapSqlite(new SQLite(":memory:"));
    try {
      await db.exec("CREATE TABLE values_test (value INTEGER)");
      await expect(db.transaction(async () => {
        await db.prepare("INSERT INTO values_test VALUES (?)").run(1);
        await db.transaction(async () => { await db.prepare("INSERT INTO values_test VALUES (?)").run(2); })();
        throw new Error("rollback");
      })()).rejects.toThrow("rollback");
      expect(await db.prepare("SELECT * FROM values_test").all()).toEqual([]);
    } finally { await db.close(); }
  });
  it("keeps concurrent requests outside another request's transaction", async () => {
    const db = wrapSqlite(new SQLite(":memory:"));
    try {
      await db.exec("CREATE TABLE values_test (value INTEGER)");
      const failed = db.transaction(async () => {
        await db.prepare("INSERT INTO values_test VALUES (?)").run(1);
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error("rollback");
      })();
      const unrelated = db.prepare("INSERT INTO values_test VALUES (?)").run(2);
      await expect(failed).rejects.toThrow("rollback");
      await unrelated;
      expect(await db.prepare("SELECT * FROM values_test").all()).toEqual([{ value: 2 }]);
    } finally { await db.close(); }
  });
});
