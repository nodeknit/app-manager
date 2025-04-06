import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: [{ find: "@src", replacement: resolve(__dirname, "./src") }],
  }
});
