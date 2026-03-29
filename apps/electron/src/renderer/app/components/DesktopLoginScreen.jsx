import { Card, LoginView, StatusBanner } from '@saintrocky/ui';

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
    <div className="desktop-App">
      <div className="desktop-Hero">
        <Card className="desktop-HeroCard">
          <div className="layout-stack-gap-8">
            <p className="desktop-Kicker">Desktop enforcement hub</p>
            <h1>{runtime?.branding?.productName || runtime?.appName || 'Standard Deviants'}</h1>
            <p className="Kicker">Local member runtime for desktop awareness, violation prompts, and override handling.</p>
          </div>
        </Card>
      </div>
      <div className="desktop-CenteredContent">
        <StatusBanner className="desktop-StatusBanner" message={banner.message} tone={banner.tone} />
        <LoginView
          email={email}
          password={password}
          loading={authLoading}
          onEmailChange={onEmailChange}
          onPasswordChange={onPasswordChange}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
