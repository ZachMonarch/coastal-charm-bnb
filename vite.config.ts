// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      // 🚨 SECURITY: Block service role key imports in client-side code (preserved from Classic config)
      {
        name: "block-service-role-imports",
        enforce: "pre" as const,
        resolveId(id: string, importer?: string) {
          const JS_PATTERNS = /\.(mjs|cjs|js|ts|jsx|tsx)$/i;
          if (!importer || !JS_PATTERNS.test(importer)) {
            return null;
          }
          const GUARDED_PATHS = [
            "supabaseServer",
            "/lib/supabaseServer",
            "/integrations/supabase/supabaseServer",
          ];
          if (GUARDED_PATHS.some((p) => id.includes(p))) {
            throw new Error(
              "\n🚨 SECURITY VIOLATION: Attempted to import supabaseServer.ts which contains SUPABASE_SERVICE_ROLE_KEY!\n" +
                "Use server functions / edge functions for admin operations instead.\n",
            );
          }
          return null;
        },
      },
    ],
  },
});
