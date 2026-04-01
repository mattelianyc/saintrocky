export const metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Saint Rocky web, desktop, and browser runtime products."
};

export default function PrivacyPage() {
  return (
    <main className="sr-MarketingShell">
      <section className="sr-MarketingSection">
        <div className="sr-MarketingSection__content">
          <p className="eyebrow">Saint Rocky</p>
          <h1>Privacy Policy</h1>
          <p>
            Saint Rocky collects only the information required to authenticate users, synchronize
            runtime state across the web dashboard, browser extension, and desktop app, and
            enforce the rules that users configure.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>Account data such as email address, display name, and role.</li>
            <li>Session and runtime tokens used to authenticate trusted clients.</li>
            <li>Rule assignments, override requests, and runtime event history.</li>
            <li>Visited page URLs and domains processed by the browser extension for rule enforcement.</li>
            <li>Wallet links, escrow vault references, and trade or violation telemetry tied to your account.</li>
          </ul>

          <h2>How we use data</h2>
          <ul>
            <li>Authenticate you and keep your sessions active across supported runtimes.</li>
            <li>Deliver rule assignments, runtime updates, and override countdown state in real time.</li>
            <li>Record discipline violations, overrides, and related escrow activity.</li>
            <li>Operate social and campaign features when you use those parts of the product.</li>
          </ul>

          <h2>Browser extension disclosures</h2>
          <p>
            The Saint Rocky browser extension reads the current page URL and domain on visited tabs
            so it can determine whether an active rule should block access. That browsing data is
            used only for rule enforcement, runtime session status, and related audit events.
          </p>

          <h2>Sharing and retention</h2>
          <p>
            Saint Rocky does not sell personal information. Data is retained only as long as
            needed to operate the product, provide security and audit history, and comply with
            legal obligations tied to billing or on-chain activity.
          </p>

          <h2>Security</h2>
          <p>
            We use authenticated APIs, encrypted transport, and scoped runtime tokens to protect
            account and runtime data. No system can guarantee perfect security, but we continuously
            improve controls around session handling, origin validation, and runtime coordination.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy questions, contact <a href="mailto:privacy@saintrocky.com">privacy@saintrocky.com</a>.
          </p>
        </div>
      </section>
    </main>
  );
}
