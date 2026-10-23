# EMUCON — English game-banner poster + motion handoff

1. Share `EMUCON-Game-Banner-EN-1080x1350.png` or JPG. The 2160×2700 PNG is the higher-resolution master.
2. Give Claude Code this whole folder and `CLAUDE_CODE_PROMPT.md`. Keep local art, fonts and assets beside `poster.html` / `styles.css`.
3. This revision enlarges EMUCON, reduces the year, removes the whale and old invitation, and inserts actual website-game previews in a source-paper banner. The source-derived club watermark remains faint and static.
4. Displayed schedule: **Festival 14:00–20:00**, **24 October 2026**, **EMU Stadium**. Club booth hours are intentionally omitted at the user's request.
5. Authentic complete English EMU and new English Directorate signatures remain integrated into the upper paper. No footer logo band.
6. No video is included yet. The prompt specifies a future gentle 10-second loop; this static poster is the visual master.

Design reference: https://emurpg.com/emucon and the supplied EMUCON 2026 Drive kit. The teaser is rendered from this project's real `src/ui/StandHome.tsx` GamePreview components and their styles, without changing gameplay or player data. See `art/WEBSITE-TEASER-SOURCE.json`. Original artwork, font licenses and identity provenance are retained.
