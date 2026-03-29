import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

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
