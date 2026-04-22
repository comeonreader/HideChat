import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const devProxyTarget = process.env.HIDECHAT_DEV_PROXY_TARGET ?? "http://127.0.0.1:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.HIDECHAT_DEV_HOST ?? "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: devProxyTarget,
        changeOrigin: true
      },
      "/ws": {
        target: devProxyTarget,
        changeOrigin: true,
        ws: true
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    exclude: ["tests/browser/**", "node_modules/**", "dist/**"]
  }
});
