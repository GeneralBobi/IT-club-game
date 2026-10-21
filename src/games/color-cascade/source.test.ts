import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("original Color Cascade integration", () => {
  it("ships the original HTML, CSS and JavaScript byte for byte", () => {
    for (const file of ["index.html", "style.css", "script.js"]) {
      expect(readFileSync(`public/games/color-cascade/${file}`).equals(readFileSync(`vendor/color-cascade/${file}`))).toBe(true);
    }
  });
});
