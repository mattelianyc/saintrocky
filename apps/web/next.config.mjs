import { loadEnvFiles } from "@saintrocky/config/load-env-files";

loadEnvFiles();

/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true
  },
  transpilePackages: [
    "@saintrocky/alerts",
    "@saintrocky/api-client",
    "@saintrocky/billing",
    "@saintrocky/branding",
    "@saintrocky/config",
    "@saintrocky/escrow",
    "@saintrocky/icons",
    "@saintrocky/network-policies",
    "@saintrocky/shared",
    "@saintrocky/ui",
    "@saintrocky/users",
    "@saintrocky/wallet",
    "@saintrocky/workflows"
  ]
};

export default nextConfig;
