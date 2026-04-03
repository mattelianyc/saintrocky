import { DesktopLoadingScreen } from './components/DesktopLoadingScreen.jsx';
import { DesktopLoginScreen } from './components/DesktopLoginScreen.jsx';
import { DesktopRuntimeShell } from './components/DesktopRuntimeShell.jsx';
import { useDesktopRuntimeShell } from './hooks/useDesktopRuntimeShell.js';

export function App() {
  const {
    activePath,
    activeSectionId,
    authLoading,
    banner,
    email,
    password,
    pendingActionSubmittingId,
    refreshing,
    runtime,
    runtimeHub,
    updater,
    user,
    view,
    actions
  } = useDesktopRuntimeShell();

  if (view === 'login') {
    return (
      <DesktopLoginScreen
        authLoading={authLoading}
        banner={banner}
        email={email}
        password={password}
        runtime={runtime}
        onEmailChange={actions.setEmail}
        onPasswordChange={actions.setPassword}
        onSubmit={actions.handleLogin}
      />
    );
  }

  if (view === 'loading' || !runtime || !runtimeHub) {
    return <DesktopLoadingScreen />;
  }

  return (
    <DesktopRuntimeShell
      activePath={activePath}
      activeSectionId={activeSectionId}
      banner={banner}
      pendingActionSubmittingId={pendingActionSubmittingId}
      refreshing={refreshing}
      runtime={runtime}
      runtimeHub={runtimeHub}
      updater={updater}
      user={user}
      onArmToggle={actions.handleArmToggle}
      onCheckForUpdates={actions.handleCheckForUpdates}
      onLogout={actions.handleLogout}
      onPendingActionCancel={actions.handlePendingActionCancel}
      onPendingActionConfirm={actions.handlePendingActionConfirm}
      onPreferenceToggle={actions.handlePreferenceToggle}
      onRuntimeRefresh={actions.handleRuntimeRefresh}
      onSidebarNavigate={actions.handleSidebarNavigate}
      onViolationAction={actions.handleViolationAction}
      onConfirmOverride={actions.handleConfirmOverride}
      onCancelOverride={actions.handleCancelOverride}
    />
  );
}
