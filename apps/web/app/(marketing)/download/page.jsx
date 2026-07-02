import "./download-page.scss";

const latestDesktopDownloadUrl =
  "https://github.com/mattelianyc/saintrocky/releases/download/v0.1.0/Saint.Rocky-0.1.0-arm64.dmg";
const latestDesktopReleaseUrl = "https://github.com/mattelianyc/saintrocky/releases/latest";

export const metadata = {
  title: "Download $TANDARD / DEVIANT$ Desktop",
  description: "Download the signed and notarized $TANDARD / DEVIANT$ desktop app for macOS."
};

export default function DownloadPage() {
  return (
    <main className="sr-MarketingShell sr-DownloadPage">
      <section className="sr-DownloadPage__hero">
        <div className="sr-DownloadPage__content">
          <p className="sr-Eyebrow">Desktop App</p>
          <h1>Download $TANDARD / DEVIANT$ for macOS.</h1>
          <p className="sr-DownloadPage__lede">
            Install the signed and notarized desktop runtime to stay connected to your rules,
            alerts, and account activity outside the browser.
          </p>
          <div className="sr-DownloadPage__actions">
            <a
              className="sr-DownloadPage__button sr-DownloadPage__button--primary"
              href={latestDesktopDownloadUrl}
            >
              Download for Apple Silicon
            </a>
            <a
              className="sr-DownloadPage__button sr-DownloadPage__button--secondary"
              href={latestDesktopReleaseUrl}
              target="_blank"
              rel="noreferrer"
            >
              View Latest Release
            </a>
          </div>
        </div>
      </section>

      <section className="sr-DownloadPage__details">
        <div className="sr-DownloadPage__grid">
          <article className="sr-DownloadPage__panel">
            <h2>What you get</h2>
            <ul>
              <li>Native desktop access to your runtime status and account session.</li>
              <li>Signed and notarized macOS distribution for safer installation.</li>
              <li>GitHub-hosted release delivery aligned with future auto-update support.</li>
            </ul>
          </article>

          <article className="sr-DownloadPage__panel">
            <h2>System requirements</h2>
            <ul>
              <li>macOS on Apple Silicon (arm64).</li>
              <li>Internet access to reach $TANDARD / DEVIANT$ APIs and release assets.</li>
              <li>Permission to install apps downloaded outside the App Store.</li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
