import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const extensionDirectory = path.resolve(currentDirectory, "..");
const tokensSourcePath = path.resolve(
  extensionDirectory,
  "..",
  "..",
  "packages",
  "design-tokens",
  "src",
  "tokens.css"
);
const themeDirectory = path.join(extensionDirectory, "src", "theme");
const popupThemeOutputPath = path.join(themeDirectory, "extension-theme.css");
const overlayThemeOutputPath = path.join(themeDirectory, "overlay-theme.css");

function writeFile(outputPath, contents) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, contents, "utf8");
}

function extractDarkThemeBlock(tokensCss) {
  const match = tokensCss.match(/:root\[data-theme='dark'\]\s*\{([\s\S]*?)\}\s*$/);
  if (!match?.[1]) {
    throw new Error("Failed to extract dark design tokens for the extension overlay theme.");
  }

  return match[1].trim();
}

const tokensCss = fs.readFileSync(tokensSourcePath, "utf8");
const darkThemeBlock = extractDarkThemeBlock(tokensCss);

writeFile(
  popupThemeOutputPath,
  `/* Generated from packages/design-tokens/src/tokens.css. */\n${tokensCss}\n`
);

writeFile(
  overlayThemeOutputPath,
  `/* Generated from packages/design-tokens/src/tokens.css. */\n#saintrocky-extension-overlay {\n${darkThemeBlock}\n}\n`
);
