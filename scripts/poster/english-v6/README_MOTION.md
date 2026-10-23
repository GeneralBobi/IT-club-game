# COME PLAY motion delivery

The poster stays static when opened normally. `motion.js` only exposes `window.renderFrame(seconds)`; it has no timers or automatic playback. The export renderer injects it into the already exported local poster.

From the repository root, after running the static poster renderer:

```powershell
node scripts/poster/english-v6/render-motion.mjs --proof
node scripts/poster/english-v6/render-motion.mjs --render --sharing-copy
```

The first command only creates five proof PNGs and `motion-proof/loop-validation.json`. The second creates those proofs, renders 300 frames and encodes the final silent video. The optional sharing copy is 1080 × 1350; the primary MP4 is 2160 × 2700. Both are 30 fps, 10 seconds, H.264 and yuv420p. There are no external resources or added visuals. Set `FFMPEG_PATH` to override the installed Windows executable.

## Standalone package

Keep `poster.html`, `styles.css`, `motion.js`, `render-motion.mjs`, `art/` and `assets/` together. Install Node.js and FFmpeg, then run these setup commands once inside the package folder:

```powershell
npm install --no-save @playwright/test
npx playwright install chromium
```

Set `FFMPEG_PATH` to the full path of your FFmpeg executable. Keep `ffprobe` alongside it. Then render from the package folder:

```powershell
$env:FFMPEG_PATH = 'C:\path\to\ffmpeg.exe'
node render-motion.mjs --proof
node render-motion.mjs --render --sharing-copy
```

The renderer detects the adjacent poster and its `art/` and `assets/` folders and writes all proofs and videos into that same package folder. Repository source files without their own resource directories continue to use `output/social/english-v6`.

## Choreography

The rocket is the focus: a 5 px anticipation dip, ignition, a 90 px lift around 2.35 seconds, a smaller second lift, then a smooth return by 9.25 seconds. Banking stays within 5 degrees and the flame stretches at most 10 percent. Whale movement is subordinate: ±12 px horizontal, ±6 px vertical and ±2 degrees. COME and PLAY have a brief, staggered emphasis of less than one percent scale. Two collage stars have a quiet staggered twinkle; the other stars stay still. The club watermark has a slow 10 px lateral drift with constant opacity.

The paper, both official institutional marks, club stamp, planet, halftone and print grain remain stationary. The original layer transforms are captured and composed with export motion; every frame resets to its captured baseline before applying deterministic displacement.

The 0 and 10 second proof PNGs must be byte identical, and frame 0 must equal the static master. The renderer also checks protected layer transforms, opacity and bounds at every proof frame. The video contains frames 0 through 299 at 30 fps; the duplicate endpoint is intentionally omitted so the next repeat begins at frame 0. `motion-render-report.json` records actual ffprobe metadata and fails delivery if dimensions, frame rate, frame count, duration, codec, pixel format or audio differ from the requested output.

## Artwork and identity

The still master is `EMUCON-Print-Motion-EN-2160x2700.png`; 1080x1350 PNG/JPG are convenience copies. The user-supplied v3 COME PLAY composition and Meet and Greet print texture/watermark reference govern this revision. There is no game-preview banner. The authentic English EMU and new Directorate signatures have no separate paper sticker; they remain horizontal and static over the existing amber event area, above all grain overlays. Their original colors/proportions are preserved.

Illustrations and fonts originate in the supplied EMUCON Drive kit. The authentic club disc is a native cropped viewport of the supplied original logo, with no redrawing. See `assets/source-inventory.json` and `art/WATERMARK-SOURCE.json`. The real club booth schedule is deliberately omitted from the poster; Festival 14:00-20:00 is the overall event window. No video audio track or music license is needed because the delivery is silent.
