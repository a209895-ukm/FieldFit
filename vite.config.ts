import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
export default defineConfig(({ mode }) => ({
  root: resolve("app"),
  publicDir: resolve("public"),
  base: mode === "pages" ? "/FieldFit/" : "/",
  define: {
    "import.meta.env.VITE_STATIC_DEMO": JSON.stringify(
      mode === "pages" ? "true" : "false",
    ),
  },
  plugins: [
    react(),
    {
      name: "fieldfit-api",
      async configureServer(server) {
        if (mode === "pages") return;
        const { apiMiddleware } = await import(
          pathToFileURL(resolve(".server/server/http.js")).href
        );
        const port = Number(process.env.PORT ?? 5173);
        const origin = new URL(
          process.env.PUBLIC_ORIGIN ?? "http://127.0.0.1:" + port,
        ).origin;
        server.middlewares.use(apiMiddleware(origin));
      },
    },
  ],
  resolve: {
    alias: {
      "@/lib/client-api": resolve(
        mode === "pages" ? "lib/client-api.pages.ts" : "lib/client-api.ts",
      ),
      "@": resolve("."),
    },
  },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 5173),
    strictPort: true,
    fs: {
      deny: [
        ".env*",
        "**/.data/**",
        "**/.wrangler/**",
        "**/.git/**",
        "**/server/**",
        "**/.server/**",
        "**/lib/question-bank.ts",
        "**/db/**",
        "**/scripts/**",
      ],
    },
  },
  build: {
    outDir: resolve(mode === "pages" ? "dist/pages" : "dist/client"),
    emptyOutDir: true,
    assetsDir: "site-assets",
  },
}));
