import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import Database from "better-sqlite3";

let child: ChildProcess;
let base: string;
let directory: string;
let db: Database.Database;
let cookie: string;
const participantId = randomUUID();

async function boot() {
  child = spawn(process.execPath, ["--import=tsx", "server/src/index.ts"], {
    env: { ...process.env, NODE_ENV: "test", PORT: "0", DATABASE_PATH: join(directory, "arena.sqlite"), SESSION_SECRET: "integration-tests-only-" + "x".repeat(32) },
    stdio: ["ignore", "pipe", "pipe"]
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("API startup timed out")), 15_000);
    let output = "";
    child.stderr?.on("data", (chunk) => { output += String(chunk); });
    child.stdout?.on("data", (chunk) => {
      const port = String(chunk).match(/listening on port (\d+)/)?.[1];
      if (port) { base = `http://127.0.0.1:${port}`; clearTimeout(timer); resolve(); }
    });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => { clearTimeout(timer); reject(new Error(`API exited ${code}: ${output}`)); });
  });
}

async function stop() {
  if (!child || child.exitCode !== null) return;
  await new Promise<void>((resolve) => { child.once("exit", () => resolve()); child.kill(); });
}

async function api(path: string, method = "GET", body?: unknown, authenticated = false) {
  return fetch(`${base}${path}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(authenticated ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5_000)
  });
}

async function start(game = "zero-point", challenger = "Ada", identity = participantId) {
  const response = await api("/api/play", "POST", { participantId: identity, game, challenger });
  expect(response.status).toBe(201);
  return (await response.json()).id as string;
}

beforeAll(async () => {
  directory = mkdtempSync(join(tmpdir(), "opencode", "arena-"));
  // Reproduce an existing four-game database to exercise the upgrade on startup.
  const legacy = new Database(join(directory, "arena.sqlite"));
  legacy.exec(`
    CREATE TABLE participants (id TEXT PRIMARY KEY, created_at INTEGER NOT NULL);
    CREATE TABLE game_sessions (
      id TEXT PRIMARY KEY, participant_id TEXT NOT NULL REFERENCES participants(id),
      game TEXT NOT NULL CHECK (game IN ('zero-point', 'target-rush', 'perfect-align', 'brain-firewall')),
      challenger TEXT NOT NULL, started_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL,
      completed_at INTEGER, score INTEGER CHECK (score >= 0)
    );
    INSERT INTO participants VALUES ('legacy-participant', 1);
    INSERT INTO game_sessions VALUES ('legacy-run', 'legacy-participant', 'perfect-align', 'Legacy Challenger', 1, 2, 2, 4321);
    CREATE TABLE extension_fixture(id TEXT PRIMARY KEY REFERENCES game_sessions(id), notes TEXT);
    INSERT INTO extension_fixture VALUES ('legacy-run', 'Preserve extension foreign keys');
  `);
  legacy.close();
  await boot();
  db = new Database(join(directory, "arena.sqlite"));
  const salt = randomBytes(16);
  const key = scryptSync("arena-integration-password", salt, 64);
  db.prepare("INSERT INTO admin_users (username, password_hash, role) VALUES (?, ?, ?)")
    .run("integration-admin", `scrypt$16384$8$1$${salt.toString("hex")}$${key.toString("hex")}`, "super_admin");
  const login = await api("/api/admin/login", "POST", { username: "integration-admin", password: "arena-integration-password" });
  expect(login.status).toBe(200);
  cookie = login.headers.get("set-cookie")!.split(";")[0];
}, 20_000);

afterAll(async () => {
  db?.close();
  await stop();
  if (directory) rmSync(directory, { recursive: true, force: true });
});

describe("connected arena API", () => {
  it("upgrades the four-game database while preserving historical scores", async () => {
    const result = await (await api("/api/leaderboard/perfect-align")).json();
    expect(result.entries[0]).toMatchObject({ id: "legacy-run", challenger: "Legacy Challenger", score: 4321 });
    expect((db.prepare("SELECT sql FROM sqlite_master WHERE name = 'game_sessions'").get() as { sql: string }).sql).toContain("'snake'");
    expect((db.prepare("SELECT sql FROM sqlite_master WHERE name = 'game_sessions'").get() as { sql: string }).sql).toContain("'digital-detective'");
    expect(db.prepare("SELECT notes FROM extension_fixture").get()).toEqual({ notes: "Preserve extension foreign keys" });
    expect(db.pragma("foreign_key_check")).toEqual([]);
    // Remove this fixture before the live activity scenarios below.
    db.prepare("DELETE FROM extension_fixture WHERE id = 'legacy-run'").run();
    db.prepare("DELETE FROM game_sessions WHERE id = 'legacy-run'").run();
    db.prepare("DELETE FROM participants WHERE id = 'legacy-participant'").run();
  });
  it("protects staff metrics and reports actual initial database counts", async () => {
    expect((await api("/api/admin/overview")).status).toBe(401);
    expect(await (await api("/api/admin/overview", "GET", undefined, true)).json())
      .toMatchObject({ participants: 0, gamesPlayed: 0, activeSessions: 0, database: "connected" });
    expect(await (await api("/api/leaderboard/zero-point")).json()).toMatchObject({ entries: [] });
    expect((await api("/api/leaderboard/unknown")).status).toBe(400);
  });

  it("tracks a run, accepts its score once, and ranks only a participant's best attempt", async () => {
    const id = await start();
    expect(await (await api("/api/admin/overview", "GET", undefined, true)).json())
      .toMatchObject({ participants: 1, gamesPlayed: 0, activeSessions: 1 });
    expect((await api(`/api/play/${id}/heartbeat`, "POST")).status).toBe(204);
    expect((await api(`/api/play/${id}/complete`, "POST", { score: 80_001 })).status).toBe(400);
    expect((await api(`/api/play/${id}/complete`, "POST", { score: 7000 })).status).toBe(200);
    expect((await api(`/api/play/${id}/complete`, "POST", { score: 7000 })).status).toBe(200);
    expect((await api(`/api/play/${id}/complete`, "POST", { score: 7001 })).status).toBe(409);
    const worse = await start("zero-point", "Ada Retry");
    await api(`/api/play/${worse}/complete`, "POST", { score: 5000 });
    const second = await start("zero-point", "Grace", randomUUID());
    await api(`/api/play/${second}/complete`, "POST", { score: 8000 });
    const ranks = await (await api("/api/leaderboard/zero-point")).json();
    expect(ranks.entries.map((entry: { challenger: string; score: number; rank: number }) => [entry.rank, entry.challenger, entry.score]))
      .toEqual([[1, "Grace", 8000], [2, "Ada", 7000]]);
    expect(await (await api("/api/admin/overview", "GET", undefined, true)).json())
      .toMatchObject({ participants: 2, gamesPlayed: 3, activeSessions: 0 });
  });

  it("separates all seven boards and supports anonymous zero-point scores", async () => {
    for (const game of ["target-rush", "perfect-align", "brain-firewall", "snake"]) {
      const id = await start(game, "");
      await api(`/api/play/${id}/complete`, "POST", { score: 0 });
      const result = await (await api(`/api/leaderboard/${game}`)).json();
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0]).toMatchObject({ rank: 1, challenger: "Anonymous Challenger", score: 0 });
    }
    expect(Object.keys(await (await api("/api/leaderboards")).json())).toHaveLength(7);
    expect(await (await api("/api/admin/overview", "GET", undefined, true)).json()).toMatchObject({ configuredGames: 7 });
  });

  it("saves and ranks Snake runs, rejects invalid scores, and treats retries as one completed run", async () => {
    const id = await start("snake", "Grid Runner");
    expect((await api(`/api/play/${id}/complete`, "POST", { score: -150 })).status).toBe(400);
    expect((await api(`/api/play/${id}/complete`, "POST", { score: 150.5 })).status).toBe(400);
    expect((await api(`/api/play/${id}/complete`, "POST", { score: 1250 })).status).toBe(200);
    expect((await api(`/api/play/${id}/complete`, "POST", { score: 1250 })).status).toBe(200);
    const result = await (await api("/api/leaderboard/snake")).json();
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ rank: 1, challenger: "Grid Runner", score: 1250 });
    expect((await api(`/api/play/${id}/complete`, "POST", { score: 2000 })).status).toBe(409);
  });

  it("removes abandoned and expired runs from active sessions", async () => {
    const abandoned = await start();
    await api(`/api/play/${abandoned}`, "DELETE");
    const expired = await start();
    db.prepare("UPDATE game_sessions SET last_seen_at = ? WHERE id = ?").run(Date.now() - 91_000, expired);
    expect(await (await api("/api/admin/overview", "GET", undefined, true)).json()).toMatchObject({ activeSessions: 0 });
    await api(`/api/play/${expired}/heartbeat`, "POST");
    expect(await (await api("/api/admin/overview", "GET", undefined, true)).json()).toMatchObject({ activeSessions: 1 });
    await api(`/api/play/${expired}`, "DELETE");
  });

  it("broadcasts changes over the live event stream", async () => {
    const controller = new AbortController();
    const stream = await fetch(`${base}/api/events`, { signal: controller.signal });
    const reader = stream.body!.getReader();
    await reader.read(); // Initial connection event.
    const next = reader.read();
    await start("target-rush", "Live challenger");
    const event = await next;
    expect(new TextDecoder().decode(event.value)).toContain("event: change");
    controller.abort();
    await reader.cancel().catch(() => {});
  });

  it("retains scores and staff sessions after restarting the API", async () => {
    await stop();
    await boot();
    const result = await (await api("/api/leaderboard/zero-point")).json();
    expect(result.entries[0]).toMatchObject({ challenger: "Grace", score: 8000 });
    const snake = await (await api("/api/leaderboard/snake")).json();
    expect(snake.entries[0]).toMatchObject({ challenger: "Grid Runner", score: 1250 });
    expect((await api("/api/admin/overview", "GET", undefined, true)).status).toBe(200);
  }, 20_000);

  it("separates shorter stand rules from every historical score", async()=>{
    const response=await api("/api/play","POST",{participantId:randomUUID(),game:"zero-point",challenger:"Short round",rulesVersion:2});
    expect(response.status).toBe(201);const {id}=await response.json();
    expect((await api(`/api/play/${id}/complete`,"POST",{score:321})).status).toBe(200);
    const current=await(await api("/api/leaderboard/zero-point?rules=2")).json();
    expect(current.entries).toHaveLength(1);expect(current.entries[0]).toMatchObject({id,score:321});
    const historical=await(await api("/api/leaderboard/zero-point?rules=1")).json();
    expect(historical.entries.some((entry:{id:string})=>entry.id===id)).toBe(false);
    expect(historical.entries[0]).toMatchObject({challenger:"Grace",score:8000});
    expect((await api("/api/play","POST",{participantId:randomUUID(),game:"zero-point",challenger:"Invalid",rulesVersion:3})).status).toBe(400);
  });

  it("owns bilingual stand cases, rejects replay, preserves saved scores and staff login on next-player reset",async()=>{
    const identity=randomUUID();
    const start=await api("/api/stand/start","POST",{participantId:identity,game:"myth-fact",nickname:"Stand visitor",language:"tr"},true);
    expect(start.status).toBe(201);const view=await start.json();expect(view.cursor).toBe(0);expect(view.reveal).toBeNull();expect(view).not.toHaveProperty("seed");
    expect((await api(`/api/stand/${view.id}`)).status).toBe(401);
    const en=await(await api(`/api/stand/${view.id}?language=en`,"GET",undefined,true)).json();expect(en.statement).not.toBe(view.statement);
    const responses=await Promise.all([api(`/api/stand/${view.id}/answer`,"POST",{cursor:0,answer:false,language:"tr"},true),api(`/api/stand/${view.id}/answer`,"POST",{cursor:0,answer:false,language:"tr"},true)]);
    expect(responses.map(r=>r.status).sort()).toEqual([200,409]);
    expect((await api(`/api/play/${view.id}/complete`,"POST",{score:500})).status).toBe(400);
    const dd=await api("/api/stand/start","POST",{participantId:identity,game:"digital-detective",nickname:"Stand visitor",language:"tr"},true);expect(dd.status).toBe(201);const caseView=await dd.json();expect(caseView.clues).toHaveLength(3);expect(caseView.questions).toHaveLength(3);expect(caseView.questions[0]).not.toHaveProperty("correctOption");
    expect((await api(`/api/stand/${view.id}`,"GET",undefined,true)).status).toBe(404);
    const submitted=await api(`/api/stand/${caseView.id}/report`,"POST",{answers:[null,null,null],language:"tr"},true);expect(submitted.status).toBe(200);const result=await submitted.json();expect(result).toMatchObject({completed:true,score:0});expect(result.questions[0]).toHaveProperty("explanation");
    const repeated=await(await api(`/api/stand/${caseView.id}/report`,"POST",{answers:[0,1,2],language:"en"},true)).json();expect(repeated.score).toBe(result.score);
    expect((await api("/api/player/reset","POST",undefined,true)).status).toBe(204);
    expect((await api("/api/admin/session","GET",undefined,true)).status).toBe(200);expect(await(await api("/api/admin/session","GET",undefined,true)).json()).toMatchObject({authenticated:true});
    expect((await api(`/api/stand/${caseView.id}`,"GET",undefined,true)).status).toBe(401);
    const board=await(await api("/api/leaderboard/digital-detective?rules=2")).json();expect(board.entries[0]).toMatchObject({id:caseView.id,score:0});
    const rejected=await fetch(`${base}/api/player/reset`,{method:"POST",headers:{Cookie:cookie,Origin:"https://outside.example","Sec-Fetch-Site":"cross-site"}});expect(rejected.status).toBe(403);
  });
});
