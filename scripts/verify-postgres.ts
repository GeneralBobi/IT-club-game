import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database, closeDatabase } from "../server/src/database.js";
import { createArena, gameIds } from "../server/src/arena.js";
import { createDetective } from "../server/src/digital-detective/service.js";
import { createMythService } from "../server/src/myth-fact/service.js";

assert.equal(database.dialect, "postgres", "This check requires DATABASE_URL");
const rollback = new Error("intentional verification rollback");
const participant = randomUUID();
try {
  await database.transaction(async () => {
    const arena = createArena(database);
    const id = await arena.start(participant, "zero-point", "Deployment verification");
    assert.equal(await arena.finish(id, 123), "saved");
    assert.equal(await arena.finish(id, 456), "conflict");
    for (const game of gameIds) await arena.rankings(game);
    const entries = (await arena.rankings("zero-point")).entries as { id: string; completedAt: number }[];
    const saved = entries.find(entry => entry.id === id)!;
    assert.ok(saved.completedAt > 1_700_000_000_000, "Millisecond timestamps and camelCase aliases survive PostgreSQL");
    const detective = createDetective(database, () => {});
    const started = await detective.start({ participantId: participant, nickname: "Verification", mode: "solo", caseId: "case-001", difficulty: "beginner" }, "verification-owner");
    const active = await detective.begin(started.id, "verification-owner");
    assert.equal(active.status, "active");
    assert.equal(active.case.evidence.length, 12);
    await detective.save(active.id, "verification-owner", active.progress, 0);
    await assert.rejects(detective.save(active.id, "verification-owner", active.progress, 0), /newer workspace/);
    const finished = await detective.submit(active.id, "verification-owner", active.progress.report);
    assert.equal(finished.status, "completed");
    await detective.leaderboard();
    await detective.analytics();
    const myth = createMythService(database, () => {}, () => 1_800_000_000_000);
    const game = await myth.start({ participantId: participant, nickname: "Verification", mode: "classic", difficulty: 4, categories: ["Everyday Technology", "Cybersecurity"] }, "myth-verification-owner");
    assert.equal(game.questionCount, 15);
    await myth.leaderboard();
    throw rollback;
  })();
} catch (error) {
  if (error !== rollback) throw error;
} finally {
  assert.equal(await database.prepare("SELECT id FROM participants WHERE id = ?").get(participant), undefined, "Transaction rolled back; no verification scores remain");
  await closeDatabase();
}
console.log("PostgreSQL game lifecycle, rankings, timestamps, optimistic revisions and rollback passed.");
