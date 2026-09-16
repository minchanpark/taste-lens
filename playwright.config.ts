import { defineConfig } from "@playwright/test";
process.loadEnvFile(".env.local");
try {
  process.loadEnvFile(".env.test.local");
} catch {}
export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.ts",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: "http://localhost:3000",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
  },
  reporter: [["list"], ["json", { outputFile: "evidence/e2e-results.json" }]],
});
