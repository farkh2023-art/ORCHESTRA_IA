import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      include: ["src/agents/**", "src/lib/**"],
      exclude: ["src/lib/redis.ts"],
    },
  },
});
