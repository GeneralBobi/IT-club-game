import { mkdtempSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Unit workers must never share a session database or use a cloud credential.
mkdirSync(join(tmpdir(), "opencode"), { recursive: true });
process.env.DATABASE_URL = "";
process.env.DATABASE_PATH = join(mkdtempSync(join(tmpdir(), "emucon-unit-")), "sessions.sqlite");
