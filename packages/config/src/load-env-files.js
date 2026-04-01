import fs from "node:fs";
import path from "node:path";

import dotenv from "dotenv";

let lastLoadedSignature = "";

function findWorkspaceRoot(startDirectory = process.cwd()) {
  let currentDirectory = path.resolve(startDirectory);

  while (true) {
    const packageJsonPath = path.join(currentDirectory, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
        if (packageJson?.workspaces) {
          return currentDirectory;
        }
      } catch {
        // Ignore parse issues while traversing upward.
      }
    }

    const parentDirectory = path.dirname(currentDirectory);
    if (parentDirectory === currentDirectory) {
      return path.resolve(startDirectory);
    }
    currentDirectory = parentDirectory;
  }
}

function resolveNodeEnv(explicitNodeEnv) {
  const candidate = String(explicitNodeEnv || process.env.NODE_ENV || "development").trim();
  return candidate || "development";
}

function buildEnvPaths(workspaceRoot, nodeEnv) {
  return [
    path.join(workspaceRoot, ".env"),
    path.join(workspaceRoot, `.env.${nodeEnv}`),
    path.join(workspaceRoot, ".env.local")
  ];
}

export function loadEnvFiles(options = {}) {
  const nodeEnv = resolveNodeEnv(options.nodeEnv);
  const workspaceRoot = options.workspaceRoot
    ? path.resolve(options.workspaceRoot)
    : findWorkspaceRoot(options.startDirectory || process.cwd());
  const signature = `${workspaceRoot}:${nodeEnv}`;

  if (lastLoadedSignature === signature) {
    return {
      workspaceRoot,
      nodeEnv,
      loadedPaths: buildEnvPaths(workspaceRoot, nodeEnv).filter((envPath) => fs.existsSync(envPath))
    };
  }

  const loadedPaths = [];

  buildEnvPaths(workspaceRoot, nodeEnv).forEach((envPath, index) => {
    if (!fs.existsSync(envPath)) {
      return;
    }

    dotenv.config({
      path: envPath,
      override: index > 0
    });
    loadedPaths.push(envPath);
  });

  lastLoadedSignature = signature;

  return {
    workspaceRoot,
    nodeEnv,
    loadedPaths
  };
}
