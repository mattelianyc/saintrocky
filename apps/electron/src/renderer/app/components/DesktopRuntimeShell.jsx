import {
  PendingActionsWidget,
  PageLayout,
  StatusBanner,
  usePendingActionsWidgetMode
} from '@saintrocky/ui';
import { extractPendingActions } from '@saintrocky/shared';

import { DesktopRuntimeContent } from './DesktopRuntimeContent.jsx';
import { DesktopSidebar } from './DesktopSidebar.jsx';
import { DesktopViolationOverlay } from './DesktopViolationOverlay.jsx';

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
  const {
    availableViewModes,
    isNarrowViewport,
    responsiveViewMode,
    setViewMode,
    viewMode
  } = usePendingActionsWidgetMode({
    defaultViewMode: 'rail',
    preferredViewMode: 'rail',
    storageKey: 'electron-live-activity-view-mode'
  });
  const isDockedMode = responsiveViewMode === 'rail' || responsiveViewMode === 'full';
  const widget = (
    <PendingActionsWidget
      pendingActions={pendingActions}
      meteredViolation={runtimeHub?.meteredViolation}
      submittingActionId={pendingActionSubmittingId}
      viewMode={viewMode}
      responsiveViewMode={responsiveViewMode}
      availableViewModes={availableViewModes}
      isNarrowViewport={isNarrowViewport}
      expandViewMode={activeSectionId === 'home' ? 'full' : 'floating'}
      onViewModeChange={setViewMode}
      onConfirmAction={onPendingActionConfirm}
      onCancelAction={onPendingActionCancel}
    />
  );

  return (
    <div className="desktop-App">
      <PageLayout
        className="desktop-Layout"
        mainClassName={responsiveViewMode === 'full' ? 'c-PageLayout__main--hidden' : ''}
        sidebar={
          <DesktopSidebar
            activePath={activePath}
            memberLabel={user?.displayName || user?.email}
            monitorStatus={runtimeHub?.monitorStatus}
            onNavigate={onSidebarNavigate}
            onLogout={onLogout}
          />
        }
        trailingPanel={isDockedMode ? widget : null}
        trailingPanelClassName={
          responsiveViewMode === 'rail'
            ? 'c-PageLayout__trailingPanel--liveActivityRail'
            : responsiveViewMode === 'full'
              ? 'c-PageLayout__trailingPanel--liveActivityFull'
              : ''
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
          <DesktopViolationOverlay
            meteredViolation={runtimeHub?.meteredViolation}
            pendingOverrideRequest={runtimeHub?.pendingOverrideRequest}
            onViolationAction={onViolationAction}
            onConfirmOverride={onConfirmOverride}
            onCancelOverride={onCancelOverride}
          />
          {!isDockedMode ? widget : null}
        </>
      </PageLayout>
    </div>
  );
}
