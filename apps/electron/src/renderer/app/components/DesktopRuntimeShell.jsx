import { PageLayout, StatusBanner } from '@saintrocky/ui';

import { DesktopRuntimeContent } from './DesktopRuntimeContent.jsx';
import { DesktopSidebar } from './DesktopSidebar.jsx';

export function DesktopRuntimeShell({
  activePath,
  activeSectionId,
  banner,
  refreshing,
  runtime,
  runtimeHub,
  user,
  onArmToggle,
  onLogout,
  onPreferenceToggle,
  onRuntimeRefresh,
  onSidebarNavigate,
  onViolationAction,
  onConfirmOverride,
  onCancelOverride
}) {
  return (
    <div className="desktop-App">
      <PageLayout
        className="desktop-Layout"
        sidebar={
          <DesktopSidebar
            activePath={activePath}
            monitorStatus={runtimeHub?.monitorStatus}
            onNavigate={onSidebarNavigate}
            onLogout={onLogout}
          />
        }
      >
        <>
          <StatusBanner className="desktop-StatusBanner" message={banner.message} tone={banner.tone} />
          <DesktopRuntimeContent
            activeSectionId={activeSectionId}
            refreshing={refreshing}
            runtime={runtime}
            runtimeHub={runtimeHub}
            user={user}
            onArmToggle={onArmToggle}
            onPreferenceToggle={onPreferenceToggle}
            onRuntimeRefresh={onRuntimeRefresh}
            onViolationAction={onViolationAction}
            onConfirmOverride={onConfirmOverride}
            onCancelOverride={onCancelOverride}
          />
        </>
      </PageLayout>
    </div>
  );
}
