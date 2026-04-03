import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadExtensionRuntimeConfig } from "@saintrocky/config";
import { loadEnvFiles } from "@saintrocky/config/load-env-files";
import { parseAllowedOrigins } from "@saintrocky/shared";
import { build } from "vite";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const extensionDirectory = path.resolve(currentDirectory, "..");

const buildNodeEnv = process.env.EXTENSION_BUILD_ENV || process.env.NODE_ENV || "production";
loadEnvFiles({ nodeEnv: buildNodeEnv });

const runtimeConfig = loadExtensionRuntimeConfig(process.env);
const allowedOrigins = parseAllowedOrigins(runtimeConfig.EXTENSION_ALLOWED_ORIGINS);

await build({
  configFile: false,
  define: {
    __SAINTROCKY_EXTENSION_API_BASE_URL__: JSON.stringify(
      runtimeConfig.EXTENSION_API_BASE_URL || "http://localhost:4000"
    ),
    __SAINTROCKY_EXTENSION_ALLOWED_ORIGINS__: JSON.stringify(allowedOrigins)
  },
  publicDir: false,
  build: {
    emptyOutDir: false,
    outDir: path.resolve(extensionDirectory, "dist"),
    rollupOptions: {
      input: path.resolve(extensionDirectory, "src/content/content.js"),
      output: {
        entryFileNames: "assets/content.js",
        assetFileNames: "assets/[name][extname]",
        format: "iife",
        inlineDynamicImports: true,
        manualChunks: undefined
      }
    }
  }
});
