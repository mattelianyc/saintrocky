import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const extensionDirectory = path.resolve(currentDirectory, "..");
const manifestPath = path.resolve(extensionDirectory, "manifest.json");
const distDirectory = path.resolve(extensionDirectory, "dist");

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

async function resolvePopupPath() {
  const candidatePaths = [
    path.resolve(distDirectory, "popup.html"),
    path.resolve(distDirectory, "src/popup/popup.html")
  ];

  for (const candidatePath of candidatePaths) {
    try {
      await fs.access(candidatePath);
      return path.relative(distDirectory, candidatePath).split(path.sep).join("/");
    } catch {}
  }

  return "src/popup/popup.html";
}

manifest.background = {
  service_worker: "assets/background.js",
  type: "module"
};
manifest.action = {
  ...manifest.action,
  default_popup: await resolvePopupPath()
};
manifest.content_scripts = (manifest.content_scripts || []).map((contentScript) => ({
  ...contentScript,
  js: ["assets/content.js"]
}));

await fs.writeFile(path.resolve(distDirectory, "manifest.json"), JSON.stringify(manifest, null, 2));
