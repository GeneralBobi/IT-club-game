import { describe, expect, it } from "vitest";
import { createCascade, selectCascadeTile, stepCascade, type CascadeState } from "./engine";
const random = () => 0;
const correct = (state: CascadeState) => selectCascadeTile(state, state.tiles.find(tile => tile.required)!.id, random);
describe("Boran's Color Cascade adaptation", () => {
  it("retains the original scoring, sequence progression and 3→4→5 lane thresholds", () => {
    let state = createCascade(random); expect(state.lanes).toBe(3); expect(state.lives).toBe(3);
    state = correct(state); expect(state.score).toBe(10); expect(state.combo).toBe(2); expect(state.cursor).toBe(1);
    for (let i=1;i<12;i++) state=correct(state);
    expect(state.completed).toBe(3); expect(state.lanes).toBe(4); expect(state.sequence).toHaveLength(3);
    for (let i=0;i<18;i++) state=correct(state);
    expect(state.completed).toBe(7); expect(state.lanes).toBe(5); expect(state.sequence).toHaveLength(3);
  });
  it("charges one life per wrong tile, prevents double activation, and restores a life at combo 5", () => {
    let state=createCascade(random); for(let i=0;i<8;i++)state=stepCascade(state,100,random);
    const distractor=state.tiles.find(tile=>!tile.required)!;state=selectCascadeTile(state,distractor.id,random);
    expect(state.lives).toBe(2);expect(selectCascadeTile(state,distractor.id,random)).toBe(state);
    for(let i=0;i<4;i++)state=correct(state);
    expect(state.combo).toBe(5);expect(state.lives).toBe(3);
  });
  it("charges only missed required tiles and stops after all three lives", () => {
    let state=createCascade(random);for(let i=0;i<160&&state.lives>0;i++)state=stepCascade(state,100,random);
    expect(state.lives).toBe(0);expect(state.score).toBe(0);expect(stepCascade(state,100,random)).toBe(state);
  });
  it("moves by elapsed time rather than monitor refresh rate", () => {
    let fast=createCascade(random),slow=createCascade(random);
    for(let i=0;i<60;i++)fast=stepCascade(fast,1000/60,random);
    for(let i=0;i<10;i++)slow=stepCascade(slow,100,random);
    expect(fast.tiles[0].y).toBeCloseTo(slow.tiles[0].y,5);
  });
});
