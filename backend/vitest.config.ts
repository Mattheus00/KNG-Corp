import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    conditions: ["react-server"],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
})
