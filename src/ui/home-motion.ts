/** Pause each decorative scene outside the viewport; pointer work runs only on input. */
export function installHomeMotion(home: HTMLElement) {
  const scenes = home.querySelectorAll<HTMLElement>(".festival-poster, .game-preview");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      (entry.target as HTMLElement).dataset.sceneMotion = entry.isIntersecting ? "running" : "paused";
    }
  });
  scenes.forEach((scene) => observer.observe(scene));
  const removePointer = installPosterPointer(home);
  return () => { observer.disconnect(); removePointer(); };
}

function installPosterPointer(home: HTMLElement) {
  const poster = home.querySelector<HTMLElement>(".festival-poster");
  if (!poster) return () => {};
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  let frame = 0;
  let pilotX = 0;
  let pilotY = 0;
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    poster.style.setProperty("--pilot-x", "0px");
    poster.style.setProperty("--pilot-y", "0px");
    poster.style.setProperty("--pilot-angle", "0deg");
  };
  const apply = () => {
    frame = 0;
    poster.style.setProperty("--pilot-x", `${pilotX * 9}px`);
    poster.style.setProperty("--pilot-y", `${pilotY * 8}px`);
    poster.style.setProperty("--pilot-angle", `${pilotX * 2}deg`);
  };
  const move = (event: PointerEvent) => {
    if (reduced.matches || !pointer.matches || home.dataset.motion === "paused" || home.closest('[data-effects="paused"]')) return;
    const bounds = poster.getBoundingClientRect();
    pilotX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
    pilotY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
    if (!frame) frame = requestAnimationFrame(apply);
  };
  const visibility = () => { if (document.hidden) reset(); };
  poster.addEventListener("pointermove", move, { passive: true });
  poster.addEventListener("pointerleave", reset);
  reduced.addEventListener("change", reset);
  document.addEventListener("visibilitychange", visibility);
  return () => {
    reset();
    poster.removeEventListener("pointermove", move);
    poster.removeEventListener("pointerleave", reset);
    reduced.removeEventListener("change", reset);
    document.removeEventListener("visibilitychange", visibility);
  };
}
