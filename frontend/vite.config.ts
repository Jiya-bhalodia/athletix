// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

const productionApiUrlGuard: Plugin = {
  name: "athletix-production-api-url",
  configResolved(config) {
    if (!config.isProduction) return;

    const apiUrl = config.env["VITE_API_URL"]?.trim();
    if (!apiUrl) {
      throw new Error("Production builds require VITE_API_URL, including the /api/v1 path.");
    }

    let parsed: URL;
    try {
      parsed = new URL(apiUrl);
    } catch {
      throw new Error("VITE_API_URL must be an absolute HTTPS URL in production.");
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      parsed.protocol !== "https:" ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "::1" ||
      hostname === "[::1]" ||
      /^127(?:\.\d{1,3}){3}$/.test(hostname)
    ) {
      throw new Error("VITE_API_URL must use HTTPS and a non-localhost host in production.");
    }
    if (
      !parsed.pathname.replace(/\/$/, "").endsWith("/api/v1") ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error(
        "VITE_API_URL must end in /api/v1 and must not contain credentials, a query, or a fragment.",
      );
    }
  },
};

export default defineConfig({
  vite: { plugins: [productionApiUrlGuard] },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
