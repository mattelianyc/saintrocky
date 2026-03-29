import { Card, Spinner } from '@saintrocky/ui';

export function DesktopLoadingScreen() {
  return (
    <div className="desktop-LoadingScreen">
      <Card className="desktop-LoadingCard">
        <div className="layout-inline-gap-12 layout-inline-center">
          <Spinner size="md" label="Loading desktop runtime" />
          <div className="layout-stack-gap-6">
            <h2>Connecting desktop runtime</h2>
            <p className="Kicker">Loading member session and desktop assignments.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
