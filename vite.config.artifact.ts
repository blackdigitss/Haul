// Builds the demo as ONE self-contained HTML file (fonts, JS, CSS inlined)
// for hosting anywhere static — used for the shareable live preview.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  // keep every non-ASCII char escaped — raw lone surrogates from minified
  // regex ranges break strict UTF-8 validators on hosting pipelines
  esbuild: { charset: "ascii" },
  define: {
    "import.meta.env.VITE_ARTIFACT": JSON.stringify("1"),
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://demo.invalid"),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("demo"),
  },
  build: {
    outDir: "dist-artifact",
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 10_000,
    rollupOptions: {
      output: { inlineDynamicImports: true },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["@tanstack/react-query", "react", "react-dom"],
  },
});
