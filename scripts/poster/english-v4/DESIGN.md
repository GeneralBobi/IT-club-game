---
name: EMUCON Come Play — English poster
description: Artifact-local record of the finished printed-space invitation and its motion handoff.
colors:
  ink: "#121a2c"
  paper: "#f3efe6"
  amber: "#de9e36"
  coral: "#c85a53"
  plum: "#3b2537"
typography:
  display:
    fontFamily: "BigShoulders, sans-serif"
    fontSize: "291px"
    fontWeight: 900
    lineHeight: 0.77
    letterSpacing: "-6px"
  festival:
    fontFamily: "BigShoulders, sans-serif"
    fontSize: "100px"
    fontWeight: 900
    lineHeight: 0.97
    letterSpacing: "-2px"
  date:
    fontFamily: "BigShoulders, sans-serif"
    fontSize: "64px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-1px"
  invitation:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "37px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.6px"
  stamp:
    fontFamily: "CourierPrime, monospace"
    fontSize: "42px"
    fontWeight: 700
    lineHeight: 1.15
  venue:
    fontFamily: "CourierPrime, monospace"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.3px"
components:
  headline:
    textColor: "{colors.paper}"
    typography: "{typography.display}"
  club-stamp:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    typography: "{typography.stamp}"
    padding: "8px 20px 7px"
---

# Design System: EMUCON Come Play — English poster

## Overview

**Creative North Star: "Printed festival poster in space"**

This record applies only to `output/social/english-v4`. Its authority is the shipped `poster.html`, `styles.css`, `EMUCON-IT-Club-Booth-EN-1080x1350.png`, original local artwork and `animation-layers.json`; it does not replace the website's design system. The English poster preserves the inherited v3 visual system: monumental cream type, a dark space field, tangible paper and original EMUCON figures. The v4 extension adds an authentic club circuit watermark, an explicit booth invitation and separately labeled booth and festival hours.

The finished deliverable is static. The current `CLAUDE_CODE_PROMPT.md` is the authority for a future gentle loop; it is a handoff, not evidence of a rendered video. The prior near-identical all-amber layout and separate footer logo band were rejected for this artifact.

**Key Characteristics:**
- Giant condensed invitation with supporting festival and club identities.
- Torn paper, restrained grain and source whale, rocket, stars and planet.
- Whole authentic English institutional signatures, horizontal and stationary.

## Colors

### Primary
- **Amber:** stamp fill and the visual family of the source date-paper artwork. The bitmap is authoritative for its textured color variation.

### Secondary
- **Coral:** year badge, stamp border and offset headline ink.

### Neutral
- **Ink:** outer canvas and dark lettering on paper.
- **Paper:** headline, invitation and small star points.
- **Plum:** the warm end of the night-field gradient; the other observed stops are `#1d2a44` and `#202236` at a 155-degree angle.

**The Source Material Rule.** Preserve original illustration and institutional asset colors; the CSS palette does not authorize recoloring source artwork.

## Typography

Local font files supply BigShoulders (900), Bricolage (700) and CourierPrime (700), with synthesis disabled. The frontmatter records the actual principal roles, not a generalized web type scale.

COME / PLAY. is the dominant two-line display, with a 45px gap between line boxes. EMUCON is secondary; its year badge uses BigShoulders (55px). The date uses the date role with a smaller year (40px). Bricolage carries “Visit the IT Club booth.” in the invitation role, followed by “Pick a game. Make your move.” (30px, letter-spacing −0.3px, 7px top margin). CourierPrime makes the club stamp and venue read like printed operational details. The booth row uses CourierPrime (25px, 700, line-height 1.05) for its label and BigShoulders (50px, 900, line-height 1, letter-spacing 0.2px) for its hours; its baseline gap is 22px and top margin is 8px. The secondary festival window uses Bricolage (22px, 700, line-height 1.1).

**The Still Type Rule.** Keep the title, invitation, festival identity and club stamp stationary in the motion handoff; date text remains registered to its paper.

## Layout

The composition is a fixed 1080×1350 canvas with clipped overflow, not a responsive website. The 2160×2700 export doubles that canvas without changing proportions. The main left alignment is 66px; the headline begins at y=375px, invitation at (79px, 925px), and date paper at (40px, 1008px), sized 1000×265px. These are composition anchors, not a reusable spacing scale.

The institutional note occupies the upper right at (651px, 40px), sized 369×246px. Its paper rotates 4 degrees while its inner marks counter-rotate −4 degrees, leaving the signatures horizontal. The complete note, including both marks, stays fixed during motion.

Source stacking is: night field (0), club circuit watermark and stars (1), festival/title/date paper (3), clipped foreground planet (4), stamp/whale/invitation/rocket (5), grain (10), institutional lockup (11). The authentic circuit watermark (`art/itclub-circuit-watermark.svg`) sits at (355px, 335px), sized 770×770px, with 0.055 opacity and the existing `brightness(0) invert(1)` treatment; it remains static and subordinate. Rocket flame is behind its body within the rocket group. `animation-layers.json` records visual axis-aligned bounds; retain the original CSS transforms rather than treating those rectangles as replacement coordinates.

## Elevation & Depth

Torn source-paper silhouettes and overlap provide physical depth. Soft cast shadows lift the institutional note (`0 13px 16px #10121c55`), event note (`0 13px 16px #10121c66`), whale (`0 10px 10px #10121c30`) and rocket (`0 10px 10px #10121c40`). The stamp uses `0 7px 12px #10121c30`. Grain repeats at 360×360px, multiplies at 0.26 opacity and sits below the official lockup.

The title's coral `6px 6px 0` text shadow is printed offset ink native to this poster, not a generic hard card shadow. Do not extrapolate it into interface elevation.

## Shapes

Paper edges come from `art/paper-slip.png` and `art/amber-slip.png`; they are not rounded cards. The title and festival group tilt −3 degrees, the stamp −7 degrees, the whale −17 degrees and the rocket 16 degrees. Tiny 4px round star pins are the only CSS circles. The planet intentionally extends outside the bottom frame.

## Components

### Invitation and event note

The literal copy is “EMUCON”, “2026”, “IT CLUB”, “COME / PLAY.”, “Visit the IT Club booth.”, “Pick a game. Make your move.”, “24 OCTOBER 2026”, “IT CLUB BOOTH 15:00–19:00”, “EMU STADIUM” and “Festival: 14:00–20:00”. Preserve punctuation, full date and both labels: the club is present 15:00–19:00; the overall festival runs 14:00–20:00. Never merge the windows. The event note places date above booth hours, then venue and secondary festival hours beneath a 2px ink rule (10px top margin, 9px top padding, 26px baseline gap). These are static print components with no hover or focus states.

### Institutional paper lockup

Use the complete `assets/EMU-logo-primary-EN.svg` and `assets/ogesim-en-navy.png` signatures. The inner vertical stack uses a 20px gap and contains each signature with a 65px maximum height. Never crop, recolor, distort, regenerate or move the marks. The paper's tilt does not authorize tilted signatures.

### Illustration layers and future motion

The HTML is static by default and disables animation/transitions for reduced motion. No video output is recorded here. Follow `CLAUDE_CODE_PROMPT.md` for the separate 10-second, 30fps motion implementation: compose original transforms; keep the camera fixed; gently lift the rocket, vary the registered flame, drift the whale and optionally move the date paper. Keep the background, club circuit watermark, planet and grain fixed.

**The Closed Loop Rule.** Frame 0 and frame 10 must match the static composition. Every animated source star is fully opaque at both endpoints; stagger dimming windows without changing endpoint values. Original faint pin opacity remains part of the static artwork. The official note and all signatures remain completely stationary.

## Do's and Don'ts

### Do:
- **Do** preserve the fixed 4:5 composition, local fonts and original source artwork.
- **Do** retain the whole English signatures, horizontal and stationary within their fixed paper note.
- **Do** compare future motion frame 0 and frame 10 against `EMUCON-IT-Club-Booth-EN-1080x1350.png`.
- **Do** preserve the separately labeled booth window (15:00–19:00) and secondary festival window (14:00–20:00).

### Don't:
- **Don't** restore the rejected all-amber composition or add a separate footer logo band to this poster.
- **Don't** add unconfirmed hours, prizes, QR destinations or rewritten copy.
- **Don't** describe the motion prompt or static HTML as a completed video.

Not canonized or repaired: the v4 finish review disposition is ship with no material fixes; the motion choreography remains an unimplemented handoff, and no synthetic palette ramps or interface primitives are promoted into this static artifact's system.
