import session from "express-session";
import type { SessionData } from "express-session";
import { database } from "./database.js";

type SessionCallback = (error: unknown, value?: SessionData | null) => void;

export class SQLiteSessionStore extends session.Store {
  private readonly readStatement = database.prepare("SELECT data, expires_at FROM sessions WHERE sid = ?");
  private readonly writeStatement = database.prepare(`
    INSERT INTO sessions (sid, data, expires_at) VALUES (?, ?, ?)
    ON CONFLICT(sid) DO UPDATE SET data = excluded.data, expires_at = excluded.expires_at
  `);
  private readonly deleteStatement = database.prepare("DELETE FROM sessions WHERE sid = ?");
  private readonly pruneStatement = database.prepare("DELETE FROM sessions WHERE expires_at <= ?");

  async get(sid: string, callback: SessionCallback): Promise<void> {
    try {
      const row = (await this.readStatement.get(sid)) as { data: string; expires_at: number } | undefined;
      if (!row) {
        callback(null, null);
        return;
      }
      if (row.expires_at <= Date.now()) {
        (await this.deleteStatement.run(sid));
        callback(null, null);
        return;
      }
      callback(null, JSON.parse(row.data) as SessionData);
    } catch (error) {
      callback(error);
    }
  }

  async set(sid: string, value: SessionData, callback?: (error?: unknown) => void): Promise<void> {
    try {
      (await this.writeStatement.run(sid, JSON.stringify(value), this.getExpiry(value)));
      (await this.pruneStatement.run(Date.now()));
      callback?.();
    } catch (error) {
      callback?.(error);
      if (!callback) this.emit("disconnect", error);
    }
  }

  async destroy(sid: string, callback?: (error?: unknown) => void): Promise<void> {
    try {
      (await this.deleteStatement.run(sid));
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async touch(sid: string, value: SessionData, callback?: (error?: unknown) => void): Promise<void> {
    try {
      (await database.prepare("UPDATE sessions SET expires_at = ? WHERE sid = ?").run(this.getExpiry(value), sid));
      callback?.();
    } catch (error) {
      if (callback) callback(error);
      else this.emit("disconnect", error);
    }
  }

  private getExpiry(value: SessionData): number {
    const cookie = value.cookie;
    return cookie.expires?.getTime() ?? Date.now() + (cookie.maxAge ?? 8 * 60 * 60 * 1000);
  }
}
