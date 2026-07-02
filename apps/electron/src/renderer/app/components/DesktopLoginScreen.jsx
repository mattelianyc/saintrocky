import { saintRockyBranding } from '@saintrocky/branding';
import { Card, LoginView, StatusBanner } from '@saintrocky/ui';

import { DesktopBrandLockup } from './DesktopBrandLockup.jsx';

export function DesktopLoginScreen({
  authLoading,
  banner,
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  runtime
}) {
  return (
    <div className="desktop-App desktop-AuthPage">
      <div className="desktop-AuthStage">
        <div className="desktop-AuthShell">
          <Card className="desktop-AuthBrandPanel">
            <div className="layout-stack-gap-16">
              <DesktopBrandLockup detail="Desktop enforcement hub for live cross-surface policy sync." />
              <div className="layout-stack-gap-8">
                <p className="desktop-Kicker">Desktop enforcement hub</p>
                <h1>{runtime?.branding?.productName || runtime?.appName || saintRockyBranding.productName}</h1>
                <p className="Kicker">
                  Local member runtime for desktop awareness, violation prompts, and override handling.
                </p>
              </div>
              <div className="desktop-AuthFeatureList" aria-label="Desktop runtime capabilities">
                <div className="desktop-AuthFeature">
                  <span>Live rule state</span>
                  <strong>Overrides, cooldowns, and alerts sync here.</strong>
                </div>
                <div className="desktop-AuthFeature">
                  <span>Member identity</span>
                  <strong>Use the same account as your dashboard and extension.</strong>
                </div>
                <div className="desktop-AuthFeature">
                  <span>Desktop visibility</span>
                  <strong>Keep critical timers visible outside the browser.</strong>
                </div>
              </div>
            </div>
          </Card>

          <div className="desktop-AuthFormColumn">
            <StatusBanner className="desktop-StatusBanner" message={banner.message} tone={banner.tone} />
            <LoginView
              email={email}
              password={password}
              loading={authLoading}
              eyebrow="Member sign in"
              title={`Connect the ${saintRockyBranding.wordmark} desktop runtime`}
              summary="Use the same $TANDARD / DEVIANT$ account that powers your web dashboard, browser extension, and companion surfaces."
              footnote="Sign in with a seeded member account to sync live assignments, alerts, and override state."
              onEmailChange={onEmailChange}
              onPasswordChange={onPasswordChange}
              onSubmit={onSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
