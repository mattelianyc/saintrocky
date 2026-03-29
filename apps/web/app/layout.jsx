import "@saintrocky/ui/base.scss";
import "@saintrocky/ui/primitives.scss";
import "@saintrocky/ui/layout.scss";
import "@saintrocky/ui/compounds.scss";

import localFont from "next/font/local";
import { saintRockyBranding } from "@saintrocky/branding";
import { loadWebRuntimeConfig } from "@saintrocky/config";
import { AuthSessionProvider } from "@/src/auth/auth-session.jsx";

const runtimeConfig = loadWebRuntimeConfig(process.env);
const silkaMonoFont = localFont({
  src: "./fonts/silkamono-regular.ttf",
  variable: "--font-silka-mono",
  display: "swap"
});

export const metadata = {
  title: saintRockyBranding.title,
  description: saintRockyBranding.description
};

export default function RootLayout({ children }) {
  const publicApiBaseUrl =
    runtimeConfig.NEXT_PUBLIC_API_BASE_URL || runtimeConfig.API_BASE_URL || "";

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SAINTROCKY_API_BASE_URL__ = ${JSON.stringify(publicApiBaseUrl)};`
          }}
        />
      </head>
      <body className={`sr-WebBody ${silkaMonoFont.variable}`}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
