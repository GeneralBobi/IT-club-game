# Deploy on Vercel

Use Node.js 24, the Vite framework preset, `npm run build`, and the `dist` output directory. The checked-in `vercel.json` routes `/api/*` to Express and other application routes to the frontend. The API runs in Frankfurt.

## Database and secrets

Create a dedicated PostgreSQL database, such as a Neon project in Frankfurt. Add these private Vercel environment variables before deploying:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL URL with TLS verification, stored as a sensitive variable. |
| `SESSION_SECRET` | Cryptographically random secret, at least 32 characters, stored as a sensitive variable. |

Vercel supplies `NODE_ENV=production`. Do not set `DATABASE_PATH` on Vercel and never use `/tmp` to persist event scores. Give preview deployments a separate test database if enabling previews. Never prefix these secrets with `VITE_`.

The first API startup initializes and seeds the schema under a database transaction lock. Later startups only check its version. Scores, administrator accounts, browser ownership and staff sessions are stored in PostgreSQL. Game operations retain the original single-writer transaction behavior across serverless instances. Existing local SQLite files remain supported; changing `DATABASE_URL` does not copy historical SQLite records.

Server-sent event connections reconnect after 25 seconds to fit the function duration limit. The existing 15-second polling also refreshes rankings across instances.

## First staff account

Create the administrator from a trusted local terminal against the production database, using the existing `npm run admin:create` command. Supply `DATABASE_URL`, `ADMIN_USERNAME` and `ADMIN_PASSWORD` through private environment variables. Remove the temporary administrator variables afterward. There is no default staff password and no public setup endpoint. Do not commit or deploy `.env`, passwords or database backups.

## Verify a deployment

1. `/api/health` returns `{"status":"ok"}` and the arena displays its online status.
2. Open `/staff`, sign in, refresh and confirm the staff session remains authenticated.
3. Play a game, save a score and check Hall of Fame.
4. Start another deployment and verify the score and staff account remain.
5. Check Myth or Fact and Digital Detective from two separate browser sessions; each must retain its own game.

Before releasing code, run `npm test`, `npm run build`, and `npm run test:browser`. The optional `node --env-file=.env --import=tsx scripts/verify-postgres.ts` check exercises real PostgreSQL game flows and rolls back its records. Run that against a dedicated pre-event or test database, not during an event.
