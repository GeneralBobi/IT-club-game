import { expect, it } from "vitest";
import SQLite from "better-sqlite3";
import { wrapSqlite } from "./database-driver.js";
import { initializeColorCascade } from "./stand-schema.js";
it("adds Color Cascade while preserving old scores and referenced case sessions", async () => {
  const raw=new SQLite(":memory:"),db=wrapSqlite(raw);
  await db.pragma("foreign_keys = ON");
  await db.exec(`CREATE TABLE participants(id TEXT PRIMARY KEY);
    CREATE TABLE game_sessions(id TEXT PRIMARY KEY,participant_id TEXT REFERENCES participants(id),game TEXT CHECK(game IN ('zero-point','digital-detective')),challenger TEXT,started_at INTEGER,last_seen_at INTEGER,completed_at INTEGER,score INTEGER,rules_version INTEGER);
    CREATE TABLE stand_attempts(id TEXT PRIMARY KEY REFERENCES game_sessions(id),owner TEXT);
    INSERT INTO participants VALUES('existing');
    INSERT INTO game_sessions VALUES('old','existing','zero-point','Visitor',1,2,3,11048,1);
    INSERT INTO game_sessions VALUES('case','existing','digital-detective','Visitor',1,2,NULL,NULL,2);
    INSERT INTO stand_attempts VALUES('case','owner');`);
  try {
    await initializeColorCascade(db);await initializeColorCascade(db);
    expect(await db.prepare("SELECT score,rules_version FROM game_sessions WHERE id='old'").get()).toEqual({score:11048,rules_version:1});
    expect(await db.prepare("SELECT owner FROM stand_attempts WHERE id='case'").get()).toEqual({owner:"owner"});
    expect(await db.pragma("foreign_key_check")).toEqual([]);expect(raw.pragma("foreign_keys",{simple:true})).toBe(1);
    await db.prepare("INSERT INTO game_sessions VALUES(?,?,?,?,?,?,?,?,?)").run('new','existing','color-cascade','Visitor',4,4,5,100,3);
    await expect(db.prepare("INSERT INTO game_sessions VALUES(?,?,?,?,?,?,?,?,?)").run('invalid','existing','unknown','Visitor',4,4,5,0,3)).rejects.toThrow();
  } finally {await db.close();}
});
