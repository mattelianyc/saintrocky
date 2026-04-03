import { Card, Spinner } from '@saintrocky/ui';

import { DesktopBrandLockup } from './DesktopBrandLockup.jsx';

export function DesktopLoadingScreen() {
  return (
    <div className="desktop-LoadingScreen">
      <Card className="desktop-LoadingCard">
        <div className="layout-stack-gap-16">
          <DesktopBrandLockup compact detail="Desktop runtime boot sequence" />
          <div className="layout-inline-gap-12 layout-inline-center">
            <Spinner size="md" label="Loading desktop runtime" />
            <div className="layout-stack-gap-6">
              <h2>Connecting desktop runtime</h2>
              <p className="Kicker">Loading member session, desktop assignments, and live enforcement state.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
