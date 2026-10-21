# EMUCON · IT Club Games

Eight browser games for the EMU Information Technology Club stand on 24 October 2026. Designed for the stand's laptops, with Turkish and English instructions, keyboard/mouse controls, optional nicknames and saved scores.

[Play the games](https://emu-it-club-game.vercel.app/)

## Play

Choose a language, select a game, read its short instruction and press **Start**. Sound is off initially and can be enabled in the footer. Nicknames are optional.

| Game | Round | Control |
| --- | --- | --- |
| Zero Point | Stop the visible clock at 5.00 seconds; one attempt, up to 1,000 points | Space / Enter |
| Target Rush | Hit targets for 30 seconds | Mouse; Tab / Enter also works |
| Perfect Align | Consecutive hits advance automatically; zones shrink and the marker speeds up | Space / Enter |
| Color Cascade | Follow the falling color sequence; three lives and progressively more lanes | Mouse or lane keys 1-5; Space pauses |
| Snake | Collect food and avoid walls and your tail | Arrow keys; Space pauses |
| Brain Firewall | Five questions with feedback after each answer | Mouse or keys 1–4 |
| Myth or Fact | Five claims within 90 seconds | Choose Myth or Fact |
| Digital Detective | Three clues and three decisions within three minutes | Read and select answers |

The festival poster and game list is the main page. The other approved menus remain available at [/lobby](https://emu-it-club-game.vercel.app/lobby) and [/classic](https://emu-it-club-game.vercel.app/classic). All three use the same games, scores and language setting.

## At the stand

- Use **Next player** between visitors. Confirming ends the current run and clears the nickname and this browser's game ownership; saved scores remain. The language and staff login remain available.
- **Scores** shows the selected game's standings. Stand rounds and earlier records have separate boards because their rules differ.
- If saving fails, keep the result open and use **Retry** before handing over the laptop.
- The staff sign-in is at **/staff**. Accounts must be created by an operator; there is no default password. Existing advanced cases, question management and staff controls remain in this separate interface.

## Run locally

Use Node.js 22 or later and npm.

~~~powershell
npm install
Copy-Item .env.example .env
~~~

Set a private random SESSION_SECRET of at least 32 characters in .env. Leave DATABASE_URL empty for local SQLite, or set it to your PostgreSQL connection string. Keep .env private.

~~~powershell
npm run dev
~~~

Open the Vite URL printed in the terminal. The API normally runs on port 3001. Stop both with Ctrl+C.

To create an operator account, set ADMIN_USERNAME and ADMIN_PASSWORD privately in the terminal environment, then run npm run admin:create. The password must contain at least 12 characters. Remove the environment variables afterwards.

## Vercel

The existing deployment belongs to the Emu-IT team. Vercel needs DATABASE_URL for persistent PostgreSQL and SESSION_SECRET for browser/staff sessions. Local SQLite is for local use; it is not persistent storage on Vercel.

The repository's vercel.json supplies the frontend build and API routing. Run npm run build, deploy to the linked project, and verify a real game and score on the deployed address. Schema updates are additive; keep database backups and preserve earlier scores.

~~~powershell
npm test
npm run test:browser
npm run build
~~~

The browser suite uses its own temporary SQLite database. The optional scripts/verify-postgres.ts checks a configured PostgreSQL database inside a transaction and rolls its verification data back.

## Artwork

EMUCON illustrations, fonts and paper textures come from the organizer's shared 2026 artwork kit. Official IT Club, DAÜ and organizer footer artwork is placed as supplied, with proportional scaling. Font licenses are included in public/fonts. The exact PSD layers are listed in public/event/PSD-SOURCES.json.

[Original repository](https://github.com/GUMELINNOVATION/IT-club-game) · [Deployment fork](https://github.com/GeneralBobi/IT-club-game)
