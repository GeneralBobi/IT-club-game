import type { AlignStage } from "./perfect-align/engine";

export const ZERO_TARGET_MS = 5000;
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
      speed: Math.min(0.8, 0.24 + level * 0.025),
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
  return ["zero-point", "perfect-align", "color-cascade"].includes(game)
    ? 3
    : 2;
}
