---
name: EMUCON COME PLAY — English v6
description: Source-printed festival invitation and deterministic motion companion.
colors:
  ink: "#121a2c"
  paper: "#f3efe6"
  amber: "#de9e36"
  coral: "#c85a53"
  plum: "#3b2537"
typography:
  display:
    fontFamily: "BigShoulders, sans-serif"
    fontSize: "288px"
    fontWeight: 900
    lineHeight: 0.77
    letterSpacing: "-6px"
  festival:
    fontFamily: "BigShoulders, sans-serif"
    fontSize: "166px"
    fontWeight: 900
    lineHeight: 0.97
    letterSpacing: "-3px"
  club:
    fontFamily: "BigShoulders, sans-serif"
    fontSize: "93px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "1px"
  date:
    fontFamily: "BigShoulders, sans-serif"
    fontSize: "73px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-1px"
  invitation:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.5px"
  venue:
    fontFamily: "CourierPrime, monospace"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.3px"
  festival-hours:
    fontFamily: "Bricolage, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1
---

# Design System: EMUCON COME PLAY — English v6

## Overview

**Creative North Star: "Printed COME PLAY"**

This is the artifact-local record of the finished English v6 poster, not the game website's design system. Its visual authority is the supplied COME PLAY composition and the supplied Meet and Greet print reference: condensed monumental lettering, a pitted dark field, authentic circuit contours, cut-paper event information and source space illustrations.

The composition leads with unboxed festival and club identities, then the oversized two-line invitation. Motion keeps this same camera and composition, giving the rocket the largest displacement while preserving the printed information and institutional marks. This record describes the implementation; it does not imply user acceptance.

**Key Characteristics:**
- Unboxed, condensed festival and club typography.
- Visible bitmap halftone and multiply print grain.
- Cropped circuit watermark and source collage illustrations.
- Intact English institutional signatures on the existing amber note.
- Static default with deterministic export-only motion.

## Colors

Warm paper, amber and coral sit against a dark blue-to-plum field; the frontmatter records the stylesheet's named color primitives.

### Primary
- **Paper:** festival name, monumental invitation and supporting invitation copy.
- **Amber:** club name and the visual family of the supplied event-note bitmap.

### Secondary
- **Coral:** year and the title's source-print registration effect.

### Neutral
- **Ink:** page surround and event information text.
- **Plum:** terminal stop of the background gradient. The other observed gradient stops are `#1d2a44` and `#202236` at 0% and 48%, with plum at 100% and an angle of 155 degrees.

### Named Rules
**The Intact Signatures Rule.** Institutional signatures retain their supplied colors, proportions and content-language versions; grain and motion do not alter them.

## Typography

**Display Font:** BigShoulders, locally loaded from `big-shoulders-black.ttf`, with sans-serif fallback.
**Body Font:** Bricolage, locally loaded from `bricolage-bold.ttf`, with sans-serif fallback.
**Label/Mono Font:** CourierPrime, locally loaded from `courier-prime-bold.ttf`, with monospace fallback.

**Character:** The condensed black display face supplies the scale and urgency; the rounded bold invitation and typewritten venue soften the printed collage. All visible copy is short and English.

### Hierarchy
- **Display:** the frontmatter display role forms COME / PLAY.; its two block lines have a 43 px interline margin.
- **Festival:** the frontmatter festival role pairs with a coral year (900, 80 px, line-height 1, tracking -1 px).
- **Club:** the frontmatter club role sits beside the actual source club emblem.
- **Date:** the frontmatter date role anchors the amber note.
- **Invitation:** the frontmatter invitation role enlarges its second line to 42 px with inherited weight and line height.
- **Venue / festival hours:** the frontmatter venue and festival-hours roles separate place from the labeled overall festival hours.

### Named Rules
**The Unboxed Identity Rule.** Festival name, year and club name sit directly on the printed field, without the rejected screenshot banner.

## Layout

The source is a fixed 1080 × 1350 pixel canvas with absolute positioning and hidden overflow. The still master is exported at 2160 × 2700. It is not a responsive website layout and supplies no breakpoint or spacing scale.

The festival begins at (62, 52), the club identity at (69, 239), and the title at (61, 396); all three groups rotate -3 degrees. The club emblem is 94 × 94 pixels, with a 22 px gap to the club text. The festival/year gap is 25 px. The invitation begins at (83, 936) and rotates -5 degrees.

The event note occupies (40, 1076), measures 1000 × 245 pixels, and rotates -3 degrees. Its copy begins at an internal (42, 36). The institutional group independently occupies (620, 1095), width 350 px, with a 20 px vertical gap; its individual signatures remain horizontal and undistorted. There is no separate institutional paper or footer band.

## Elevation & Depth

Depth comes from bitmap paper edges, layer overlap, print grain and sparse soft illustration shadows. The title carries a hard coral registration offset (`6px 6px 0`); this is an existing artifact feature, excluded from reusable shadow tokens and future component guidance.

### Shadow Vocabulary
- **Illustration lift:** whale `drop-shadow(0 10px 10px #10121c30)` and rocket `drop-shadow(0 10px 10px #10121c40)`.
- **Paper lift:** event note `drop-shadow(0 13px 16px #10121c66)`.

### Named Rules
**The Printed Field Rule.** The repeated halftone and grain stay stationary; the official institutional signatures sit above the grain.

## Shapes

The supplied amber-slip bitmap supplies the irregular paper silhouette. Source whale, rocket and planet preserve their drawn contours. The upper-right watermark combines the authentic extracted circuit contour with a thin enclosing circle: a 1030 px square at (516, -224), opacity 0.13, with a 1.5 px paper-colored ring and an 850 px inner source image inset by 90 px. Its crop is deliberate. Small pin stars use 4 px circles at opacity 0.48; illustrated stars retain their source geometry.

## Components

This poster has no buttons, inputs, navigation or interactive component states. The sidecar samples its actual typographic components; these are static print specimens.

### Festival and club identities

The unboxed festival/year line and emblem/club line use the Typography and Layout roles above. The club emblem is the supplied `itclub-emblem-source.svg`; the watermark uses the extracted `itclub-circuit-watermark.svg`. The club identity stays still during export.

### Monumental invitation

COME and PLAY. are independent spans inside one rotated heading. Export motion briefly raises COME by 3 px and PLAY by 4 px, with opposite 0.3 degree rotations and scales of 1.006 and 1.009. Their opacity stays unchanged. The emphasis returns to baseline by 1.28 seconds.

### Event note and institutional signatures

The date, venue and labeled festival hours share the supplied amber bitmap. Full English EMU and Directorate signatures sit over its existing right-hand region, above the grain at z-index 11. The date note and signatures remain stationary. The copy states 24 OCTOBER, EMU STADIUM and Festival · 14:00–20:00; booth hours are omitted in this artifact.

### Printed field

Halftone repeats the supplied bitmap at 145 × 137 px, brightness zero, multiply blend and opacity 0.24. Grain repeats at 360 × 360 px, multiply blend and opacity 0.57 at z-index 10. The circuit watermark drifts horizontally by ±10 px during export, with constant opacity.

### Source illustrations and export motion

The whale measures 275 px wide at (748, 565), rotated -17 degrees; motion adds ±12 px horizontally, ±6 px vertically and ±2 degrees. The rocket measures 126 × 278 px at (826, 808), rotated 16 degrees. It anticipates by 5 px, lifts 90 px at 2.35 seconds, banks up to 5 degrees, takes a smaller second lift, and returns by 9.25 seconds. Flame stretch is bounded by 10 percent. Two of the five illustrated stars pulse; pins and the planet stay still. The planet begins at y=1312 and is cropped by the canvas.

`motion.js` has no playback timer: it exposes `renderFrame(seconds)` for deterministic frame export. Motion interpolates with smoothstep `x*x*(3-2*x)`, resets every tracked element to baseline before each sample, and loops over 10 seconds at 30 fps (300 frames). The normal HTML remains static and includes a reduced-motion CSS guard. The proof report verifies unchanged protected layers, frame zero matching the static master, and byte-identical 0/10-second PNGs. The actual `motion-render-report.json` verifies the 2160 × 2700 master as H.264, yuv420p, 30 fps, 300 frames, 10.000 seconds and no audio. The delivery agent also verified the 1080 × 1350 sharing copy with the same encoding properties. Decoded MP4 frames at 2.5 seconds and the final frame were visually checked; this is encoded-frame inspection, not a claim of real-time playback.

## Do's and Don'ts

### Do:
- **Do** preserve the actual supplied club, circuit and institutional assets.
- **Do** keep official English signatures horizontal, intact and above grain.
- **Do** preserve the static baseline and deterministic loop endpoint equality.
- **Do** label 14:00–20:00 as festival hours.

### Don't:
- **Don't** restore the rejected screenshot banner or give the institutional pair a separate paper or footer strip.
- **Don't** redraw, recolor, fade, distort or animate institutional signatures.
- **Don't** add the omitted 15:00–19:00 booth hours to this artifact.
- **Don't** treat this artifact's fixed positions or title registration offset as global website rules.

Not canonized or repaired: the existing hard title offset is excluded from reusable system rules and component tokens under the craft floor; it is recorded as an artifact deviation, with no repair authorized in this documentation-only scope. Actual encoded-video metadata and decoded keyframes are verified as described above.
