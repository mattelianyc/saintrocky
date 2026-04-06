import { saintRockyBranding } from '@saintrocky/branding';
import roccoIcon from '../assets/rocco-icon.png';

export function DesktopBrandLockup({ className = '', eyebrow, detail, compact = false }) {
  const lockupClassName = ['desktop-BrandLockup', compact ? 'desktop-BrandLockup--compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={lockupClassName}>
      <div className="desktop-BrandMonogram" aria-hidden="true">
        <img src={roccoIcon} alt="" className="desktop-BrandMark" />
      </div>
      <div className="desktop-BrandCopy">
        <p className="desktop-BrandEyebrow">{eyebrow || saintRockyBranding.companyName}</p>
        <p className="ui-BrandWordmark desktop-BrandWordmark">
          {saintRockyBranding.inlineWordmark || saintRockyBranding.wordmark || '$TANDARD/DEVIANT$'}
        </p>
        {detail ? <p className="desktop-BrandDetail">{detail}</p> : null}
      </div>
    </div>
  );
}
