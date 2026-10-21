import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    include: ["server/src/**/*.test.ts", "src/**/*.test.ts"]
  }
});
