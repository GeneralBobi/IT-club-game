---
name: "EMU IT Club — EMUCON Games"
description: "Source festival artwork, paper surfaces, and direct game controls."
colors:
  amber: "#de9e36"
  amber-hover: "#efb654"
  coral: "#c85a53"
  paper: "#f0ede6"
  ink: "#121a2c"
  muted: "#48505d"
  line: "#b6b5ae"
  field: "#fffdf7"
  focus: "#154b87"
  myth: "#7a2e2b"
  fact: "#285b42"
  gold: "#985d09"
typography:
  display:
    fontFamily: "Big Shoulders Display, sans-serif"
    fontSize: "clamp(68px, 8.15vw, 123px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Big Shoulders Display, sans-serif"
    fontSize: "clamp(48px, 4.65vw, 70px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Big Shoulders Display, sans-serif"
    fontSize: "clamp(31px, 3vw, 46px)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 800
    lineHeight: 1.5
  laptop-headline:
    fontFamily: "Big Shoulders Display, sans-serif"
    fontSize: "clamp(36px, 6.7svh, 66px)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  laptop-title:
    fontFamily: "Big Shoulders Display, sans-serif"
    fontSize: "clamp(25px, 4.8svh, 44px)"
    fontWeight: 900
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  laptop-control:
    fontFamily: "Bricolage, Arial, sans-serif"
    fontSize: "clamp(12px, 1.7svh, 16px)"
    fontWeight: 400
    lineHeight: 1.5
  case-time:
    fontFamily: "Courier Prime, monospace"
    fontSize: "22px"
    fontWeight: 700
  club-name:
    fontFamily: "Georgia, serif"
    fontSize: "23px"
    fontWeight: 400
    letterSpacing: "0.015em"
rounded:
  field: "3px"
  key: "5px"
  secondary: "7px"
  secondary-lobby: "8px"
  action: "10px"
  choice: "12px"
  game: "14px"
  dialog: "16px"
spacing:
  small: "6px"
  control: "12px"
  grid: "14px"
  row: "16px"
  content: "24px"
  section: "28px"
  desktop-gutter: "40px"
  mobile-gutter: "22px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "11px 20px"
  button-primary-hover:
    backgroundColor: "{colors.amber-hover}"
  button-festival:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "18px 20px"
    height: "68px"
  button-festival-laptop:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "10px 12px"
    height: "clamp(44px, 7.5svh, 64px)"
  button-quiet:
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "10px 18px"
  game-row:
    backgroundColor: "#f6f3ec66"
    textColor: "{colors.ink}"
    rounded: "{rounded.game}"
    padding: "12px"
  input:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "11px 14px"
  key-hint:
    backgroundColor: "#f9f6ef"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    padding: "7px 20px"
  choice-myth:
    backgroundColor: "{colors.myth}"
    textColor: "#f3efe6"
    rounded: "{rounded.choice}"
  station-tool:
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "8px"
    width: "40px"
  score-filter:
    textColor: "{colors.ink}"
    rounded: "{rounded.secondary-lobby}"
    padding: "8px 14px"
  score-filter-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  choice-fact:
    backgroundColor: "{colors.fact}"
    textColor: "#f3efe6"
    rounded: "{rounded.choice}"
---

# Design System: EMU IT Club — EMUCON Games

## Overview

**Creative North Star: "Supplied Festival Print"**

The supplied festival poster kit sets the world: neutral paper, dense dark ink, amber fields, coral registration, grain and halftone. Condensed headlines carry the invitation; rounded game surfaces keep the controls approachable. The source rocket, planet, stars and year stamp retain the event’s drawn and printed character.

The shared shell gives original institutional identities quiet space above and below the games. Festival is the default composition; Lobby and Classic are valid expressions of the same palette, typography, controls and source artwork. Turkish and English use the same hierarchy and complete identity strips. Color Cascade is a source-preserved exception inside its original iframe: its native colors, font, hearts, effects, controls and internal English text remain unchanged; the surrounding station retains this festival system and bilingual instructions.

**Key Characteristics:**

- Printed source material with neutral paper and dark ink.
- Condensed headlines paired with readable Bricolage instructions.
- Rounded game surfaces, visible controls and direct amber actions.
- Static original identities, coordinated source-art flight and controllable miniature demonstrations.

## Colors

Amber and coral carry the festival print; neutral paper and ink carry reading and interaction. Frontmatter records the final cascading values.

### Primary
- **Festival Amber:** poster field, play actions, selected language underline and heading strokes. The lighter amber is the button hover state.

### Secondary
- **Record Gold:** trophy and ranking accents, distinct from broad amber play actions.
- **Registration Coral:** source planet, year stamp, poster registration and scene accents.
- **Myth Maroon / Fact Green:** the two large Myth or Fact answer controls; paper lettering keeps both readable.

### Neutral
- **Neutral Paper:** shared page background and identity surroundings.
- **Midnight Ink:** text, outlines, dividing rules and dark preview surfaces.
- **Muted Slate:** secondary instructions; **Warm Line:** field and list dividers.
- **Field White:** editable controls. **Focus Blue:** keyboard focus outline, separate from selection.

### Named Rules
**The Original Identity Rule.** Use complete supplied identity artwork at its original proportions, with quiet clearspace; keep logos static and free of effects.

The separately supplied club circuit motif is a decorative source-derived exception, not a replacement identity. Its contours are traced from the actual club artwork and recorded in `public/brand/WATERMARK-SOURCE.json`; the complete club and university signatures retain the rule above.

## Typography

**Display Font:** Big Shoulders Display (sans-serif fallback), self-hosted black (900).
**Body Font:** Bricolage (Arial, sans-serif fallback), self-hosted regular, medium, semibold, bold and extra bold.
**Label/Mono Font:** Courier Prime (monospace fallback), self-hosted bold for actual case timestamps. The header club name uses Georgia (serif fallback).

**Character:** Very condensed headlines provide poster scale without crowding the wider, rounded instruction text. Body text remains regular; heavier weights mark actions, choices and identity details.

### Hierarchy
- **Display:** the frontmatter display role is the festival invitation; the event wordmark separately scales with its container (44cqw), at a tighter line-height (0.9).
- **Headline:** the programme invitation uses the headline role; game-page headings use the same display family at a fixed desktop size (72px).
- **Title:** featured game names use the title role. Classic uses smaller condensed names (30px); Lobby uses a larger fluid title (38–66px).
- **Body:** the base body role is used for instructions and prose, with paragraph measure capped (72ch). Featured game summaries scale (17–23px) with a tighter line-height (1.3).
- **Label:** language buttons and utility navigation are compact (14px). Primary Festival actions are Bricolage bold (28px / 1.1); case choice labels are extra bold (30px).
- **Laptop density:** the laptop headline, title and control roles override the default Festival sizes at the height-aware desktop breakpoint. Game summaries use a smaller fluid size (14–20px), alongside visible names, controls and actions. The poster wordmark scales against both container width and height, rather than page zoom.

### Named Rules
**The Role Separation Rule.** Use Big Shoulders Display for station headlines, Bricolage for station instructions and controls, and Courier Prime for actual case timestamps. The Georgia club name is confined to the identity area. The original Color Cascade iframe retains its source typography.

## Layout

The shared header, menu and footer are centered within a maximum canvas (1505px). Desktop outer gutters are generous (40px); the compact shell uses narrower gutters (22px). Thin horizontal rules separate identity, game choices and utility actions. Spacing is contextual rather than a strict arithmetic scale: repeated controls use small gaps, game rows use a steady gap (16px), and sections use broader breathing room.

Festival uses an asymmetrical poster/programme split (39.35% / 60.65%). Its programme has inset padding (28px 34px 36px); featured rows arrange preview, copy/control and action in three columns (37% / remaining / 22%), with a minimum height (188px). At intermediate widths (801–1200px), the split shifts (36% / 64%). At 800px and below the poster stacks above the programme. At 540px and below rows become two columns with a full-width action beneath; secondary games remain a two-column group.

At widths of at least 1000px and heights of at least 560px, Festival gives the header and menu the first viewport. The menu fills the height remaining below the responsive header; the complete footer follows below the fold in normal document flow. The poster/programme split remains 39.35% / 60.65%; three equal flexible rows use preview/copy/action columns (34% / remaining / 20%), compact row padding (6px) and height-aware gaps (8–16px). Five secondary choices form a three-column group. The full launcher and all eight games fit from 1024×600 without page scaling or clipped controls. The menu uses the height recovered by placing the footer below the first viewport. Utility actions and the unmodified organizer strip share that footer horizontally. Phones retain natural document scrolling and the existing stacked composition.

Lobby uses three dominant game cards with a quieter five-choice group. Classic uses a centered intro and a four-column game library on desktop. Both retain their own responsive grids; the Festival poster split is a composition, not a requirement for future surfaces. Game pages use a narrower centered reading/play area (1120px maximum). Outside the laptop breakpoint, organizer artwork follows the utility footer inside a centered maximum width (1000px).

## Elevation & Depth

The interface is largely flat: buttons have no box shadow. Ink borders, colored preview scenes, source grain and halftone distinguish surfaces. Dialogs use a translucent ink backdrop (#121a2c80), without introducing a raised card shadow. A station-control error notice uses a small diffuse shadow to remain readable over the page; this is an overlay exception. Source art remains layered within the poster and previews.

### Shadow Vocabulary
- **Poster registration** (`text-shadow: 3px 3px 0 var(--coral)`): the event wordmark and festival invitation only.
- **Control error notice** (`box-shadow: 0 8px 24px #121a2c18`): a small recovery overlay beneath the station controls.
- **Preview cursor** (`filter: drop-shadow(1px 2px 2px #0005)`): the small aiming cursor inside Target Rush’s scene.

### Named Rules
**The Printed Depth Rule.** Use borders, source texture and tonal layering for depth. The coral registration on festival display text belongs to the poster; it is not a general container shadow.

## Shapes

The shared game-card radius is generous; previews and primary buttons use a slightly tighter curve. Small secondary choices use compact curves, while inputs and quiet utility buttons retain small corners. Dialog and result containers are the softest large surfaces. Myth or Fact answer controls have their own intermediate radius. These actual roles are recorded in frontmatter rather than forced into one radius.

Featured Festival rows use a fine ink border (1.5px); general cards use a lighter stroke weight (1px). Header dividers and utility rules are thin (1px); section and poster rules are stronger (2px). Circular targets and small rounded scene marks belong to game graphics. Institutional artwork has no added border radius or clipping.

## Components

### Buttons
Broad, confident actions with an amber fill and ink label. Base actions have a minimum height (49px); Festival actions are taller (68px desktop, 48px compact). Hover shifts the fill to lighter amber. Press scales the action (0.97); the Festival arrow moves right on hover or focus (4px). Shared keyboard focus uses a blue outline (3px) outside the edge (5px offset). Quiet actions are transparent with an ink border and a minimum height (44px). Disabled buttons reduce opacity (0.55).

The height-aware laptop Festival action uses its frontmatter variant with a minimum height (44px) and fluid Bricolage label (20–27px), keeping the same amber, ink, curve and interaction states.

### Cards / Containers
Game cards use paper or transparent surfaces, an ink outline and the shared game radius. Festival rows use a translucent light-paper fill, compact padding and a three-column arrangement; Lobby cards use more internal space, while Classic cards keep the library dense. Previews are clipped within their own rounded scene. Results and dialogs use the larger container radius.

### Inputs / Fields
Light field fill, warm thin border (1px), small corners and comfortable padding; editable controls have a minimum height (44px). The shared focus outline remains visible. Detective radio options keep native radio controls, with an amber-tinted checked row and ink outline. Errors use a pale coral field with dark maroon border and readable text.

### Navigation
The identity area leads the shared header. Language controls are text buttons with an amber underline on the selected state. Game navigation and footer utilities pair small line SVG icons with text; hover underlines the label. Responsive wrapping preserves language access while the club-name text is hidden at the narrowest width. Original IT Club artwork and the full DAÜ signature remain whole; the supplied Turkish or English EMURPG / DAÜ / ÖGESİM strip follows below.

### Station Controls and Scoreboards
Compact line-SVG controls keep scores, sound, menu-animation pause and supported fullscreen in the header. Tool buttons have a 44px minimum height and 40px width (36px on narrow phones), small action curves and a muted-paper hover fill. Pressed toggles use ink with paper icons. Accessible names describe the action; the scores label hides at narrow widths while its button remains available. The mobile header uses two rows, preserving language access. Fullscreen failure appears as a short status notice beneath the controls.

The scoreboard uses a centered 1080px canvas, wrapping game filters with an ink/paper selected state, strong top rule, ranked rows and a pale amber leader band. Large tabular points align at the right; long nicknames wrap. On narrow phones the score unit stacks beneath its number. Loading rows breathe, refresh rotates, and reduced-motion removes both effects. Empty and error states show concrete play or retry actions; earlier-rule boards remain available in disclosure content. Shared results separate score/summary from game detail in two columns, then place replay and save status across the bottom; at 700px they stack with the replay action first.

### Control Hints
Real key labels sit in small light keycaps beside concise instructions; mouse and arrow controls use line SVGs. Festival keycaps use an ink outline (1.5px), medium body weight and a compact curve. The hint communicates the actual control before play.

### Game Previews and Motion
Previews show miniature mechanics: timer, target field, alignment zone, falling color tiles, snake, quiz answers or case records. Dark scene surfaces keep pale text and coral/amber marks distinct; the source planet forms a foreground horizon. Treat previews as illustrations of gameplay rather than additional controls.

The printed wordmark uncovers once (720ms), the year stamp lands (650ms after 180ms), and the invitation follows with short clipped reveals (600ms and 500ms). One source-art flight grammar coordinates the rocket (4.8s; up to 13px right and 31px up, 23–28 degrees), independently breathing engine (780ms), dashed exhaust (1.7s, with a 1.3s inner trail), five original stars (3.3s) and a passing star (9.2s). Fine-pointer input adds bounded rocket steering (±9px horizontally, ±8px vertically, ±2 degrees), returning to rest on pointer leave. The planet, circuit watermark and complete institutional identities remain static.

Featured previews demonstrate their mechanics repeatedly at rest, with readable dwells: Zero Point (5.2s), Perfect Align (4.1s), Target Rush (5.6s). Hover or keyboard focus shortens those cycles (2.8s, 2.3s, 3.1s), while row fill and amber actions respond without shifting the grid. This is the user-authorized comprehensive experience revision; the earlier one-shot-only preview rule is superseded.

Home animation pauses when the document is hidden or home is offscreen; individual poster and preview scenes also pause outside the viewport. The header motion toggle pauses menu animation, including pseudo-elements, and persists the preference. Reduced-motion disables decorative flight, preview and transition motion; exhaust and passing-star trails disappear. Native route transitions retain a short exit (160ms) and entry (300ms). Game feedback respects reduced motion separately: Target Rush retains a stepped, four-state target-lifetime indicator because it communicates time rather than decoration.

### Source Artwork and Print Adaptation
The club circuit contour sits faintly behind the web poster at its right edge (10% opacity, 89% width, right offset -23%, top 21%). It uses source geometry rather than invented circuit decoration. The October reference supplies this motif treatment; the existing amber festival palette and current event information remain the composition's source.

The current A3 v2 directly reconstructs the user's 584×748 amber poster crop with the actual source vectors and fonts. The artwork fills the upper 375mm (89.3% of the 297 × 420mm trim), followed by one quiet 45mm institutional row; there is no upper identity band. The full official DAÜ outlined signature appears once, with a 33mm emblem, beside the whole club, directorate and EMURPG identities. The first adaptation with large separate white header/footer bands is rejected historical output, not an approved pattern.

The final page has 5mm bleed (307 × 430mm media) and at least 5mm content inset. Independently composed type is outlined; source illustrations remain vectors. The v2 check records no embedded fonts, no RGB paint streams, DeviceCMYK with a FOGRA39 output intent, 300ppi background and identity rasters above 600 effective ppi. `scripts/poster/build_a3_v2.py` with `poster_tools.py` produces `output/pdf/EMUCON-Oyuna-Gel-A3-v2-baski.pdf`, `-onizleme.png` and `-kontrol.json`. These are production adaptations, not additional web palette tokens.

### Game State Presentation
Zero Point presents a target duration and a continuously visible clock. Targets vary from 1.5 to 7 seconds and never repeat the immediately preceding target. The result shows points and timing error beside the same clock; Space, Enter or the broad next-target action starts another round directly without setup. Forgiving scoring awards up to 1000 points, with a 100ms full-score tolerance.

Perfect Align starts moving immediately after the initial action. The normalized marker speed starts at 0.65 and rises by 0.045 per hit, capped at 1.25; the target zone narrows with progression. Successful hits keep the marker, zone and streak feedback visible for 220ms before the next stage begins automatically. A miss ends the run.

Target Rush is a 20-second sprint. Each hit immediately replaces the target; the score, time and streak multiplier stay visible above the field. Consecutive hits increase the multiplier in four-hit steps, capped at five; gold targets award triple points. Misses and expired targets reset the streak without subtracting earned points. The result action starts a new sprint directly. Target arrival (130ms) and floating score feedback (550ms) support the action; the remaining-time track changes by transform (80ms), with reduced-motion overrides.

Color Cascade runs the original HTML, CSS and JavaScript from public/games/color-cascade in an iframe, byte-identical to vendor/color-cascade. The source's dark styling, native Segoe UI font stack, four game colors, hearts, effects, internal English text and mouse controls override station rules inside the frame. Preserve the source rather than recreate or reskin it: no added numeric tile labels, lane keys, pause UI or replacement engine. The outer station provides bilingual instructions, optional player name, navigation, fullscreen and an observer that reads the original final score without modifying the source. Its frame has a responsive height (clamp(480px, 75svh, 850px)) and a rounded outer edge (12px); fullscreen removes the outer curve. These original game materials are a local source exception, not new shared tokens.

The feedback extension adds a visible Zero Point progress measure and five-round history, an alignment hit ribbon and last-shot replay diagram, Target Rush target-lifetime ring, impact marks and multiplier steps, and clear quiz correctness feedback with numbered answer keycaps. Short result reveals (360ms), question reveals (220ms), hit registration (220ms) and score response (180ms) support the existing game rules. Failures to reconnect or save show recovery copy and retry controls rather than replacing an active round with an empty screen.

All four changed games use the current rules version for their scoreboards, keeping earlier-rule scores separate.

## Do's and Don'ts

### Do:
- **Do** use the final paper token for shared page backgrounds.
- **Do** preserve original event illustrations, grain, halftone and complete institutional artwork.
- **Do** keep the source-derived circuit motif static and faint; retain complete original identities in their own quiet areas.
- **Do** adapt print output with the original outlined university lockup, vector type and illustrations, CMYK FOGRA39 and at least 300 effective ppi for placed raster artwork.
- **Do** keep both language states legible and use the corresponding supplied organizer strip.
- **Do** show the control hint beside each game and keep the primary action broad.
- **Do** honor reduced motion, the persistent menu-animation pause control, and hidden/offscreen scene pauses.
- **Do** keep the laptop menu in the first viewport and the intact institutional footer below the fold.
- **Do** preserve Color Cascade’s original source and presentation inside its iframe; apply station styling and bilingual instructions around it.

### Don't:
- **Don't** redraw, distort, recolor, rotate or animate institutional identities.
- **Don't** carry the rejected neon command-center or sci-fi HUD treatment into new surfaces.
- **Don't** turn poster registration into hard offset shadows on controls or containers.
- **Don't** apply the superseded one-shot-only restriction to the featured menu previews; preserve their readable dwells and controllable cycles.
- **Don't** add numeric labels, lane keys, pause controls or a replacement engine to the original Color Cascade.


The legacy measurement exception remains: an older automated lobby comparison demands replacing the exact official university asset to match a malformed generated signature. Keep the original identity; do not claim that gate passed or force its state. Current evidence is the festival screenshot packet under `.impeccable/review/experience-v2/` and the v2 print preview/check report. These documents describe the implementation and do not assert user acceptance.
