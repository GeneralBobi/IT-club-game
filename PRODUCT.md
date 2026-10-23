# EMU IT Club — EMUCON Games

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Existing React 19 + Vite + TypeScript application. Express API on Vercel, persistent PostgreSQL on Neon. Preserve working scores, browser sessions, staff authentication and game ownership.

## Users
Visitors at the IT Club stand during EMUCON on 24 October 2026. The primary playing device is a laptop supplied at the stand (confirmed by Boran, 21 October). Staff operate and reset the shared machines for the next visitor.

## Product Purpose
Let a visitor quickly understand a game, play, enjoy the result, and hand the laptop to the next person. The user likes the game ideas but rejects the current visual design and finds the controls and gameplay problematic. Technical deployment success is not gameplay acceptance.

## Operating Context
EMUCON is the parent festival. The organizer's shared pack states 24 October 2026, 14:00–20:00, EMU Stadium / Yasin Düşüner Stadyumu. This is the festival time; a separate IT Club operating time has not been confirmed. This site is the IT Club's game station, not the parent festival website.

## Capabilities and Constraints
Eight games: Zero Point, Target Rush, Perfect Align, Color Cascade, Brain Firewall, Snake, Myth or Fact, Digital Detective. Scoreboards and staff controls exist. Retain the game ideas while improving clarity, controls, feedback and round flow. Prioritize mouse and keyboard on laptops; retain responsive navigation.

All visitor-facing UI and game instructions must have selectable Turkish and English (confirmed by Boran, 21 October). Turkish is the initial language. On 21 October Boran explicitly asked to implement all three shown layouts without waiting for the team's selection: direct lobby, festival programme and classic game library. They share game mechanics, language, staff authentication and persisted scores.

Boran subsequently supplied the festival comp again and selected it as the main/default page. Keep the other two working variants. Honor the supplied comp's asymmetrical amber poster/game-list composition, while adding rounded game surfaces and purposeful motion. Use real PSD paper/halftone textures, native scene previews and the organizer's supplied three-logo footer strips. Reduced-motion, hidden-tab and offscreen behavior are part of the motion implementation.

## Brand Commitments
Follow the supplied DAÜ logo usage manual. Use original artwork, proportional scaling and required clearspace. Do not redraw, distort, recolor, rotate or add effects to the university identity. Use the official primary lockup in a quiet identity area, with the suitable supplied version for its background.

23 October standing instruction: club posters and printed materials must pair the full DAÜ/EMU signature with the new official Student Development, Events and Sports Affairs Directorate logo/signature shown in this site's footer. Use the actual multicolor source, not a newly typeset substitute. Both institutional signatures must match the content language: Turkish artwork uses Turkish versions; English artwork uses English versions. Keep their proportions, clearspace and quiet footer treatment.

Boran supplied the EMUCON 2026 Drive artwork pack for reuse and adaptation, and named https://emurpg.com/emucon and https://emu-itclub-projeler-aksami.vercel.app/ as references. The current neon command-center / sci-fi HUD treatment is rejected. The replacement should be simpler and focus on fun, using the actual supplied event material rather than invented logos or unrelated decoration.

On 22 October Boran requested an A3 version of the current festival poster, more animation in the web poster, and a faint original club circuit watermark inspired by his supplied October meeting poster. Preserve the current amber composition; the reference is for the faint logo treatment, not its old date/venue or blue palette. Apply the supplied print acceptance document: final size, 5 mm bleed, at least 5 mm content inset, PDF, embedded/outlined fonts, suitable CMYK and at least 300 dpi for placed raster artwork. Deliver the actual A3 print PDF and its rendered preview.

## Evidence on Hand
On 22 October Boran rejected that first A3 adaptation: the separate oversized white header/footer lost the web poster. Rebuild the print artwork directly from his 584×748 poster crop, with the full amber composition occupying the page and one compact institutional signature row only. The previous print file is historical, not approved. He also explicitly authorized a comprehensive website/code improvement pass and parallel agents, asking for noticeably more animation and a dynamic, satisfying experience. Preserve the source-faithful Color Cascade and established game rules while improving feedback, recovery and presentation. Motion must remain controllable, reduced-motion aware and paused offscreen.
- Original shared source material: `data/design-research/sources/`, including the 41 MB layered poster kit, event illustrations, logos and four fonts. Original Drive folder: https://drive.google.com/drive/folders/1e-vCj2Y1fvXdK3zlI87UGnOXX1XvUoBz
- Supplied source PDFs are in the user's Downloads folder; extracted text and rendered relevant pages are under `data/design-research/`.
- Current public site: https://emu-it-club-game.vercel.app; deployment account: Emu-IT.
- Existing local automated tests validate mechanics and persistence, but the user has rejected the current design and gameplay experience.

## Product Principles
1. The visitor should be able to act immediately with short, concrete instructions.
2. The play surface and feedback take priority over decorative interface chrome.
3. A shared laptop must have a clear, safe next-player flow.
4. Official brand assets are fixed artwork, not material to reinterpret.
5. Verify actual play and bilingual states in the browser, not only builds and APIs.

## Current play and screen requirements
The laptop festival menu fills the first viewport from 1024x600. The institutional footer remains intact below the fold, as Boran explicitly corrected on 21 October. Phones retain natural scrolling.

Color Cascade must run the original HTML, CSS and JavaScript unchanged, including its original presentation and controls. The rejected React rewrite has been removed. public/games/color-cascade is byte-identical to vendor/color-cascade. The surrounding station only observes final scores and supplies navigation, optional nickname and fullscreen. The source's internal English text is preserved; surrounding instructions remain selectable TR/EN.

Zero Point uses a continuously visible clock, varied non-repeating targets from 1.5 to 7 seconds, forgiving scores and one-key next rounds without returning to setup. Perfect Align starts immediately at a brisk speed and automatically advances after 220ms of hit feedback, becoming faster and narrower. Target Rush is a 20-second sprint with immediate replacement targets, streak multipliers and triple-value gold targets; misses reset the streak without subtracting earned points. These four changed games use separate current scoreboards from all earlier rules.
