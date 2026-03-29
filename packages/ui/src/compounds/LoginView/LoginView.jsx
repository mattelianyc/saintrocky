import { Button } from '../../primitives/Button/Button.jsx';
import { Card } from '../../primitives/Card/Card.jsx';
import { Field } from '../../primitives/Field/Field.jsx';
import { Input } from '../../primitives/Input/Input.jsx';

export function LoginView({
  email,
  password,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  eyebrow = 'Sign in',
  title = 'Connect this desktop to the local control plane',
  summary = 'Sign in to pull live alerts, workflows, policy state, devices, sessions, and billing data from your local API.',
  footnote = 'Use a real seeded account from your local database and that account\'s password.',
  submitLabel = 'Sign in',
  loadingLabel = 'Signing in'
}) {
  return (
    <div className="layout-center-screen desktop-AuthScreen">
      <Card className="desktop-AuthCard">
        <div className="layout-stack-gap-16">
          <div className="layout-stack-gap-8">
            <p className="desktop-Kicker">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="Kicker">{summary}</p>
          </div>

          <form className="layout-stack-gap-12" onSubmit={onSubmit}>
            <Field.Root>
              <Field.Label htmlFor="desktopEmail">Email</Field.Label>
              <Field.Control>
                <Input
                  id="desktopEmail"
                  name="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  required
                />
              </Field.Control>
            </Field.Root>

            <Field.Root>
              <Field.Label htmlFor="desktopPassword">Password</Field.Label>
              <Field.Control>
                <Input
                  id="desktopPassword"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  required
                />
              </Field.Control>
            </Field.Root>

            <Button type="submit" loading={loading} loadingLabel={loadingLabel} block>
              {submitLabel}
            </Button>
          </form>

          <p className="desktop-AuthHint">{footnote}</p>
        </div>
      </Card>
    </div>
  );
}
