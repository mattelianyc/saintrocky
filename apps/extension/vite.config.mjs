import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadExtensionRuntimeConfig } from "@saintrocky/config";
import { loadEnvFiles } from "@saintrocky/config/load-env-files";
import { parseAllowedOrigins } from "@saintrocky/shared";
import { defineConfig } from "vite";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  loadEnvFiles({ nodeEnv: mode });

  const runtimeConfig = loadExtensionRuntimeConfig(process.env);
  const allowedOrigins = parseAllowedOrigins(runtimeConfig.EXTENSION_ALLOWED_ORIGINS);

  return {
    define: {
      __SAINTROCKY_EXTENSION_API_BASE_URL__: JSON.stringify(
        runtimeConfig.EXTENSION_API_BASE_URL || "http://localhost:4000"
      ),
      __SAINTROCKY_EXTENSION_ALLOWED_ORIGINS__: JSON.stringify(allowedOrigins)
    },
    publicDir: path.resolve(currentDirectory, "src/assets"),
    build: {
      emptyOutDir: true,
      outDir: "dist",
      rollupOptions: {
        input: {
          background: path.resolve(currentDirectory, "src/background/background.js"),
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
  };
});
