# Claude Code — animate this finished poster gently

Work in this folder. This is a motion-design handoff, not a redesign task.

## Inputs and visual authority
- `poster.html` and `styles.css`: the actual editable, layered 1080×1350 composition.
- `EMUCON-IT-Club-Booth-EN-1080x1350.png`: the visual master. Preserve its final composition, copy, palette, typography and proportions exactly.
- `art/`: original EMUCON illustrations, paper, grain and licensed local fonts.
- `assets/`: authentic English EMU and new Directorate identities, with source inventory.
- Read any supplied layer manifest before coding. Use the existing element IDs, rather than rebuilding the poster from its flat PNG.

Create a separate `motion.html` / `motion.js`; preserve the original static files. Use local assets and local fonts. Run a local static server and wait for `document.fonts.ready` and every image decode before recording. No external CDN is needed.

## Deliverable
Produce a silent, seamless 10-second loop, 1080×1350, 30 fps (300 frames):
- `EMUCON-IT-Club-Booth-EN-motion.mp4`, H.264, yuv420p, suitable for Instagram.
- `EMUCON-IT-Club-Booth-EN-motion-cover.png`, exactly matching the static master.
- Editable animation source and a short reproducible render command.
An optional WebM preview is useful, but the MP4 is required. Keep the 4:5 frame; do not stretch or automatically crop it into a Story.

## Motion direction
A lightly living printed festival poster in space: playful source illustrations against calm, readable type. The camera stays fixed. No scene cuts, zoom, particles, neon glow, 3D extrusion, new illustrations, rewritten copy, added sound, AI repainting or replacement logos.

The hero is the source rocket; the whale and sparse stars are secondary. Keep the title, event identity, invitation and date readable throughout. Institutional marks are entirely static.

Use this restrained choreography:
1. `#rocket`: a slow lift of at most 8px over the first five seconds and a smooth return over the next five. Preserve its existing tilt, size and position. A useful periodic curve is y(t) = -4 * (1 - cos(2πt/10)).
2. `#rocket-flame`: gentle scaleY variation of at most ±3.5%, about its existing engine origin, roughly one smooth cycle per second; preserve registration with the body. Never flash or detach the flame.
3. `#whale`: a slow horizontal drift of at most ±10px and vertical drift of at most ±4px; rotation may vary by at most ±0.8 degrees around the existing pose. Use a 10-second sine loop that returns exactly to its base transform. Do not flip the drawing.
4. Animate at most two existing source stars at a time, dimming gently between opacity 0.70 and 1.00. Every star must have opacity exactly 1.00 at both t=0 and t=10, matching the static master. Offset the activity windows, not the endpoint values: star A may dim and return over 0–5 seconds; star B over 3–8 seconds. Outside its activity window each star stays at 1. Use a smooth cosine envelope with zero slope at both ends. Keep positions fixed; no strobing or total disappearance. The 8–10 second hold leaves all stars at the static opacity.
5. `#paper` (the amber event note) may drift vertically by at most 1.5px. Keep its existing angle and all text registered to it; avoid rotation or paper flapping.
6. Keep `#headline`, `#invitation`, `#festival-identity`, `#stamp`, `#planet`, `#background`, `#club-watermark` and `#print-grain` static. Preserve the authentic club circuit watermark at its existing 0.055 opacity, size and position. Do not pulse, rotate, recolor or promote it into a primary logo. The strong composition supplies the typography's motion energy; no need to make every element move.
7. Keep `#institutional-lockup`, its paper, and every logo inside it completely still, unchanged and horizontal. The official English EMU and new English Student Development, Events and Sports Affairs Directorate signatures must remain intact. Do not recolor, crop, distort, rotate, fade or regenerate them. Do not add a footer logo row.

## Implementation and QA
Use the project's existing tools when available. CSS/WAAPI or GSAP are enough; avoid adding a large framework solely for this render. Compose animation with the original transforms: never overwrite the poster's static rotations or accumulate transforms from the previous frame.

Provide a deterministic `window.renderFrame(timeSeconds)` (or equivalent). Seeking to a time must yield the same pixels regardless of call order. Pause any real-time CSS/WAAPI animations during frame-by-frame export. Render frames on a fixed viewport and assemble them with ffmpeg; do not use screen recording that can drop frames or catch fonts loading.

Before finalizing:
- Compare the master with frame 0: geometry, all English text, logo versions, date and venue must match.
- Inspect frames at 0, 2.5, 5, 7.5 and 10 seconds for overlap, clipping, flame registration, shadow/grain artifacts and typography stability.
- Frame 10 must return to frame 0's state. Inspect the 9.967→0 transition for a smooth loop.
- Confirm dimensions, 30 fps, 10s duration, H.264/yuv420p and absence of an audio track with ffprobe.
- Preserve all confirmed copy: `Visit the IT Club booth.`, `Pick a game. Make your move.`, `24 OCTOBER 2026`, `EMU STADIUM`, `IT CLUB BOOTH 15:00–19:00` and the separate, secondary `Festival: 14:00–20:00`. The club is present 15:00–19:00; the overall festival runs 14:00–20:00. Never merge these time windows or add new claims.

Return the actual MP4, cover image and editable source paths. If rendering fails, report the concrete blocker instead of calling an HTML preview a finished video.
