import { saintRockyBranding } from '@saintrocky/branding';
import { Icon } from '@saintrocky/icons';
import { AppSidebar, Button } from '@saintrocky/ui';

import { desktopNavigationItems } from '../config/navigation.js';
import { formatMonitorLabel } from '../utils/runtime-formatters.js';
import { DesktopBrandLockup } from './DesktopBrandLockup.jsx';

const renderedNavigationItems = desktopNavigationItems.map((item) => ({
  ...item,
  icon: <Icon name={item.iconName} size={16} />
}));

export function DesktopSidebar({ activePath, memberLabel, monitorStatus, onNavigate, onLogout }) {
  return (
    <AppSidebar
      items={renderedNavigationItems}
      activePath={activePath}
      onNavigate={onNavigate}
      brand={
        <div className="desktop-SidebarBrand">
          <DesktopBrandLockup compact detail={memberLabel || saintRockyBranding.shortProductName} />
          <span className="desktop-SidebarHint">{formatMonitorLabel(monitorStatus || 'idle')}</span>
        </div>
      }
      footer={
        <Button variant="ghost" block onClick={onLogout}>
          Sign out
        </Button>
      }
    />
  );
}
