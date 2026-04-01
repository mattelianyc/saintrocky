import { Icon } from '@saintrocky/icons';
import { AppSidebar, Button } from '@saintrocky/ui';

import { desktopNavigationItems } from '../config/navigation.js';
import { formatMonitorLabel } from '../utils/runtime-formatters.js';

const renderedNavigationItems = desktopNavigationItems.map((item) => ({
  ...item,
  icon: <Icon name={item.iconName} size={16} />
}));

export function DesktopSidebar({ activePath, monitorStatus, onNavigate, onLogout }) {
  return (
    <AppSidebar
      items={renderedNavigationItems}
      activePath={activePath}
      onNavigate={onNavigate}
      brand={
        <div className="desktop-SidebarBrand">
          <span className="desktop-SidebarEyebrow">Saint Rocky sentinel</span>
          <strong className="desktop-SidebarWordmark">std/dev</strong>
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
