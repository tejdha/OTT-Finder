import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // "" prefix loads non-VITE_ vars too. They are used here only,
  // in the dev server, and never reach the browser bundle.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api/availability": {
          target: "https://api.movieofthenight.com",
          changeOrigin: true,
          rewrite: (path) => {
            const q = new URL(path, "http://local").searchParams;
            return `/v4/shows/${q.get("mediaType")}/${q.get("tmdbId")}?country=${(q.get("country") || "").toLowerCase()}`;
          },
          headers: { "X-API-Key": env.STREAMING_AVAILABILITY_API_KEY || "" },
        },
      },
    },
  };
});