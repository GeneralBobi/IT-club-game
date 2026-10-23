/* Deterministic export-only choreography. Loading this file does not animate the poster. */
(() => {
  'use strict';
  const duration = 10;
  const TAU = Math.PI * 2;
  const ids = ['rocket', 'rocket-flame', 'whale', 'headline-come', 'headline-play', 'club-watermark'];
  const tracked = [...ids.map(id => document.getElementById(id)), ...document.querySelectorAll('#stars .star')].filter(Boolean);
  const baseline = new Map(tracked.map(el => {
    const css = getComputedStyle(el);
    return [el, { transform: css.transform === 'none' ? '' : css.transform, inlineTransform: el.style.transform, opacity: css.opacity, inlineOpacity: el.style.opacity }];
  }));
  const ease = x => x * x * (3 - 2 * x);
  const sample = (keys, t) => {
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1], b = keys[i];
      if (t <= b[0]) return a[1] + (b[1] - a[1]) * ease((t - a[0]) / (b[0] - a[0]));
    }
    return keys.at(-1)[1];
  };
  const move = (id, x = 0, y = 0, rotate = 0, sx = 1, sy = sx) => {
    const el = document.getElementById(id);
    if (!el) return;
    const base = baseline.get(el);
    el.style.transform = x === 0 && y === 0 && rotate === 0 && sx === 1 && sy === 1
      ? base.inlineTransform
      : `translate(${x.toFixed(5)}px,${y.toFixed(5)}px) rotate(${rotate.toFixed(5)}deg) scale(${sx.toFixed(6)},${sy.toFixed(6)}) ${base.transform}`;
  };
  window.renderFrame = seconds => {
    if (!Number.isFinite(seconds)) throw new TypeError('renderFrame(t) requires finite seconds.');
    const t = ((seconds % duration) + duration) % duration;
    // Reset first: frame order and prior calls can never affect the output.
    for (const [el, base] of baseline) {
      el.style.transform = base.inlineTransform;
      el.style.opacity = base.inlineOpacity;
    }
    if (t === 0) return;
    const phase = TAU * t / duration;
    // Setup -> ignition -> two buoyant lifts -> gentle landing. Displacement is in canvas pixels.
    const lift = sample([[0,0],[0.55,5],[0.95,0],[2.35,-90],[3.15,-80],[4.75,-68],[6.05,-88],[7.35,-56],[9.25,0],[10,0]], t);
    const bank = sample([[0,0],[0.55,-1],[2.35,-5],[3.15,-2.5],[4.75,1.5],[6.05,-3.5],[7.35,-1],[9.25,0],[10,0]], t);
    const side = sample([[0,0],[0.95,0],[2.35,22],[4.75,14],[6.05,24],[7.35,12],[9.25,0],[10,0]], t);
    move('rocket', side, lift, bank);
    const thrust = Math.sin(phase * 13) * 0.075 + Math.sin(phase * 7) * 0.025;
    move('rocket-flame', 0, 0, 0, 1 - thrust * 0.18, 1 + thrust);
    // A counterbalancing float keeps the whale subordinate to the rocket's staged lift.
    move('whale', 12 * Math.sin(phase), 6 * Math.sin(phase * 2), 2 * Math.sin(phase));
    // Brief typographic emphasis retains full opacity and legibility throughout.
    const come = sample([[0,0],[0.35,0],[0.65,1],[1.15,0],[10,0]], t);
    const play = sample([[0,0],[0.48,0],[0.78,1],[1.28,0],[10,0]], t);
    move('headline-come', 0, -3 * come, -0.3 * come, 1 + 0.006 * come);
    move('headline-play', 0, -4 * play, 0.3 * play, 1 + 0.009 * play);
    move('club-watermark', 10 * Math.sin(phase), 0);
    // Only two of six collage stars twinkle; the pin stars remain still.
    const stars = Array.from(document.querySelectorAll('#stars .star'));
    for (const [index, start] of [[0, 1.15], [3, 6.4]]) {
      const el = stars[index];
      if (!el) continue;
      const pulse = sample([[0,0],[start,0],[start+0.55,1],[start+1.15,0],[10,0]], t);
      const base = baseline.get(el);
      if (pulse > 0) {
        el.style.transform = `rotate(${(5 * pulse).toFixed(5)}deg) scale(${(1 + 0.045 * pulse).toFixed(6)}) ${base.transform}`;
        el.style.opacity = (Number(base.opacity) * (1 - 0.14 * pulse)).toFixed(6);
      }
    }
  };
  window.posterMotion = Object.freeze({ duration, fps: 30, frames: 300, staticByDefault: true });
})();
