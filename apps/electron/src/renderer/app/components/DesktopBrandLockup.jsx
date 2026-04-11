import { saintRockyBranding } from '@saintrocky/branding';
import { BrandWordmarkLogo } from '@saintrocky/ui';

export function DesktopBrandLockup({ className = '', eyebrow, detail, compact = false }) {
  const lockupClassName = ['desktop-BrandLockup', compact ? 'desktop-BrandLockup--compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={lockupClassName}>
      <div className="desktop-BrandCopy">
        <p className="desktop-BrandEyebrow">{eyebrow || saintRockyBranding.companyName}</p>
        <BrandWordmarkLogo className="desktop-BrandWordmark" variant="inline" width="100%" />
        {detail ? <p className="desktop-BrandDetail">{detail}</p> : null}
      </div>
    </div>
  );
}
