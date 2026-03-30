import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  publicDir: path.resolve(currentDirectory, "src/assets"),
  build: {
    emptyOutDir: true,
    outDir: "dist",
    rollupOptions: {
      input: {
        background: path.resolve(currentDirectory, "src/background/background.js"),
        content: path.resolve(currentDirectory, "src/content/content.js"),
        popup: path.resolve(currentDirectory, "src/popup/popup.html")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
        manualChunks: undefined
      }
    }
  }
});
