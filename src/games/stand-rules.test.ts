import { describe, expect, it } from "vitest";
import { continuousAlignStage, visibleClockScore, nextZeroTarget, ZERO_TARGETS_MS } from "./stand-rules";
import { evaluateAlignment } from "./perfect-align/engine";
describe("simplified stand games", () => {
  it("makes small visible-clock errors forgiving and keeps scores in range", () => {
    expect(visibleClockScore(0)).toBe(1000); expect(visibleClockScore(100)).toBe(1000);
    expect(visibleClockScore(300)).toBe(900); expect(visibleClockScore(1100)).toBe(500);
    expect(visibleClockScore(2100)).toBe(0); expect(visibleClockScore(50000)).toBe(0);
  });
  it("progresses beyond three targets without shrinking or speeding beyond playable bounds", () => {
    const first = continuousAlignStage(0, () => .5), later = continuousAlignStage(10, () => .5), limit = continuousAlignStage(1000, () => .5);
    expect(later.level.targetWidth).toBeLessThan(first.level.targetWidth); expect(later.level.speed).toBeGreaterThan(first.level.speed);
    expect(first.level.speed).toBeGreaterThanOrEqual(.65);
    expect(limit.level.targetWidth).toBeGreaterThanOrEqual(.06); expect(limit.level.speed).toBeLessThanOrEqual(1.25);
    for (const stage of [first, later, limit]) {
      expect(evaluateAlignment(stage, stage.targetCenter / stage.level.speed * 1000, 1).withinTarget).toBe(true);
      expect(evaluateAlignment(stage, 0, 1).withinTarget).toBe(false);
    }
  });
  it("offers varied Zero targets without repeating the previous duration", () => {
    for (const previous of ZERO_TARGETS_MS) for (const sample of [0,.25,.5,.999999]) {
      const next = nextZeroTarget(previous, () => sample);
      expect(next).not.toBe(previous); expect(ZERO_TARGETS_MS).toContain(next);
    }
  });
});
