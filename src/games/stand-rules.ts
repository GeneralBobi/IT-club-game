import type { AlignStage } from "./perfect-align/engine";

export const ZERO_TARGETS_MS = [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 7000];
export function nextZeroTarget(previous: number | null, random: () => number = Math.random): number {
  const choices = ZERO_TARGETS_MS.filter(value => value !== previous);
  return choices[Math.floor(random() * choices.length)];
}
export function visibleClockScore(errorMs: number): number {
  if (!Number.isFinite(errorMs) || errorMs < 0) return 0;
  return Math.max(0, 1000 - Math.round(Math.max(0, errorMs - 100) / 2));
}

export function continuousAlignStage(
  hits: number,
  random: () => number = Math.random,
): AlignStage {
  const level = Math.max(0, Math.floor(hits));
  const width = Math.max(0.06, 0.34 * Math.pow(0.9, level));
  return {
    level: {
      level: level + 1,
      name: "Stand",
      targetWidth: width,
      speed: Math.min(1.25, 0.65 + level * 0.045),
      variableSpeed: false,
      movingTarget: false,
      attemptsAllowed: 1,
    },
    stage: 1,
    stagesInLevel: 1,
    targetCenter: width / 2 + random() * (1 - width),
    markerPhase: 0,
    targetPhase: 0,
  };
}

export function currentStandRules(game: string): number {
  return ["zero-point", "perfect-align", "color-cascade", "target-rush"].includes(game)
    ? 4
    : 2;
}
