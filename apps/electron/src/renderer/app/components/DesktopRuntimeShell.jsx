import { PendingActionsWidget, PageLayout, StatusBanner } from '@saintrocky/ui';
import { extractPendingActions } from '@saintrocky/shared';

import { DesktopRuntimeContent } from './DesktopRuntimeContent.jsx';
import { DesktopSidebar } from './DesktopSidebar.jsx';

export function DesktopRuntimeShell({
  activePath,
  activeSectionId,
  banner,
  pendingActionSubmittingId,
  refreshing,
  runtime,
  runtimeHub,
  updater,
  user,
  onArmToggle,
  onCheckForUpdates,
  onLogout,
  onPendingActionCancel,
  onPendingActionConfirm,
  onPreferenceToggle,
  onRuntimeRefresh,
  onSidebarNavigate,
  onViolationAction,
  onConfirmOverride,
  onCancelOverride
}) {
  const pendingActions = extractPendingActions(runtimeHub?.rules || []);

  return (
    <div className="desktop-App">
      <PageLayout
        className="desktop-Layout"
        sidebar={
          <DesktopSidebar
            activePath={activePath}
            memberLabel={user?.displayName || user?.email}
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
            pendingActionSubmittingId={pendingActionSubmittingId}
            refreshing={refreshing}
            runtime={runtime}
            runtimeHub={runtimeHub}
            updater={updater}
            user={user}
            onArmToggle={onArmToggle}
            onCheckForUpdates={onCheckForUpdates}
            onPendingActionCancel={onPendingActionCancel}
            onPendingActionConfirm={onPendingActionConfirm}
            onPreferenceToggle={onPreferenceToggle}
            onRuntimeRefresh={onRuntimeRefresh}
            onViolationAction={onViolationAction}
            onConfirmOverride={onConfirmOverride}
            onCancelOverride={onCancelOverride}
          />
          <PendingActionsWidget
            pendingActions={pendingActions}
            submittingActionId={pendingActionSubmittingId}
            onConfirmAction={onPendingActionConfirm}
            onCancelAction={onPendingActionCancel}
          />
        </>
      </PageLayout>
    </div>
  );
}
