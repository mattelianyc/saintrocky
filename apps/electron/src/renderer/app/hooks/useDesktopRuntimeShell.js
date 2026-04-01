import { useEffect, useState } from 'react';

import {
  cancelRuntimeOverride,
  confirmRuntimeOverride,
  getRuntimeHubSnapshot,
  getRuntimeInfo,
  getSession,
  login,
  logout,
  onNavigateFromMain,
  resolveRuntimeViolation,
  setRuntimeArmed,
  setRuntimePreferences,
  subscribeRuntimeHub,
  updateNativeRuntimeState
} from '../../bridge.js';
import { resolveDesktopNavigationPath, resolveDesktopSectionId } from '../config/navigation.js';

export function useDesktopRuntimeShell() {
  const [runtime, setRuntime] = useState(null);
  const [user, setUser] = useState(null);
  const [runtimeHub, setRuntimeHub] = useState(null);
  const [view, setView] = useState('loading');
  const [banner, setBanner] = useState({ message: '', tone: 'error' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activePath, setActivePath] = useState('#home');

  const activeSectionId = resolveDesktopSectionId(activePath);

  useEffect(() => {
    const updateHash = () => {
      const nextPath = resolveDesktopNavigationPath(globalThis.location?.hash);
      setActivePath(nextPath);

      if (globalThis.location && globalThis.history && globalThis.location.hash !== nextPath) {
        globalThis.history.replaceState(null, '', `${globalThis.location.pathname}${globalThis.location.search}${nextPath}`);
      }
    };

    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  useEffect(() => {
    onNavigateFromMain((target) => {
      if (target) {
        const nextPath = resolveDesktopNavigationPath(`#${target}`);
        setActivePath(nextPath);
        if (globalThis.location) {
          globalThis.location.hash = nextPath;
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!runtimeHub) return;

    updateNativeRuntimeState({
      monitorStatus: runtimeHub.monitorStatus,
      pendingViolationCount: runtimeHub.pendingViolation ? 1 : 0,
      chainViolationCount: runtimeHub.chainViolations?.length || 0,
      hideToTrayOnClose: runtimeHub.preferences?.hideToTrayOnClose ?? true
    });
  }, [
    runtimeHub?.monitorStatus,
    runtimeHub?.pendingViolation?.violationId,
    runtimeHub?.chainViolations?.length,
    runtimeHub?.preferences?.hideToTrayOnClose
  ]);

  useEffect(() => {
    if (view !== 'shell') return undefined;

    return subscribeRuntimeHub((nextRuntimeHub) => {
      setRuntimeHub(nextRuntimeHub);
    });
  }, [view]);

  async function loadRuntimeHub({ keepBanner = false } = {}) {
    const response = await getRuntimeHubSnapshot();
    if (!response.ok) {
      setBanner({ message: response.message, tone: 'error' });

      if (response.status === 401 || response.code === 'UNAUTHORIZED') {
        setUser(null);
        setRuntimeHub(null);
        setView('login');
      }

      return false;
    }

    setRuntimeHub(response.runtimeHub);
    if (!keepBanner) {
      setBanner({ message: '', tone: 'error' });
    }

    return true;
  }

  async function bootstrap() {
    setView('loading');

    const runtimeResponse = getRuntimeInfo();
    if (!runtimeResponse.ok) {
      setBanner({ message: 'Failed to load desktop runtime configuration.', tone: 'error' });
      setView('login');
      return;
    }

    setRuntime(runtimeResponse.runtime);

    const session = await getSession();
    if (!session.ok) {
      setBanner({
        message: `${session.message}. Check that the API is running at ${runtimeResponse.runtime.apiBaseUrl}.`,
        tone: 'error'
      });
      setView('login');
      return;
    }

    if (!session.authenticated) {
      setView('login');
      return;
    }

    setUser(session.user);
    const runtimeLoaded = await loadRuntimeHub();
    setView(runtimeLoaded ? 'shell' : 'login');
  }

  useEffect(() => {
    bootstrap().catch((error) => {
      setBanner({ message: error?.message || 'Desktop runtime failed to initialize.', tone: 'error' });
      setView('login');
    });
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthLoading(true);
    setBanner({ message: '', tone: 'error' });

    try {
      const response = await login({ email: email.trim(), password });

      if (!response.ok || !response.authenticated) {
        setBanner({ message: response.message || 'Unable to sign in.', tone: 'error' });
        return;
      }

      setUser(response.user);
      setPassword('');

      const runtimeLoaded = await loadRuntimeHub();
      setView(runtimeLoaded ? 'shell' : 'login');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleLogout() {
    const response = await logout();
    if (!response.ok) {
      setBanner({ message: response.message, tone: 'error' });
      return;
    }

    setUser(null);
    setRuntimeHub(null);
    setActivePath('#home');
    setView('login');
  }

  function handleSidebarNavigate(item) {
    setActivePath(resolveDesktopNavigationPath(item.href));
  }

  async function handleRuntimeRefresh() {
    setRefreshing(true);

    try {
      await loadRuntimeHub();
      setBanner({ message: 'Desktop runtime refreshed.', tone: 'success' });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleArmToggle() {
    const response = await setRuntimeArmed(!runtimeHub?.isArmed);
    if (!response.ok) {
      setBanner({ message: response.message, tone: 'error' });
      return;
    }

    setRuntimeHub(response.runtimeHub);
    setBanner({
      message: response.runtimeHub.isArmed ? 'Desktop runtime armed.' : 'Desktop runtime disarmed.',
      tone: 'success'
    });
  }

  async function handlePreferenceToggle(key) {
    const response = await setRuntimePreferences({
      [key]: !runtimeHub?.preferences?.[key]
    });
    if (!response.ok) {
      setBanner({ message: response.message, tone: 'error' });
      return;
    }

    setRuntimeHub(response.runtimeHub);
  }

  async function handleViolationAction(action) {
    const response = await resolveRuntimeViolation(action);
    if (!response.ok) {
      setBanner({ message: response.message, tone: 'error' });
      return;
    }

    setRuntimeHub(response.runtimeHub);
    if (action === 'pay_to_bypass' && response.runtimeHub?.pendingOverrideRequest) {
      setBanner({ message: 'Override countdown started.', tone: 'success' });
    } else {
      setBanner({
        message: action === 'pay_to_bypass' ? 'Override activated for this rule.' : 'Violation marked as complied.',
        tone: 'success'
      });
    }
  }

  async function handleConfirmOverride() {
    const response = await confirmRuntimeOverride();
    if (!response.ok) {
      setBanner({ message: response.message, tone: 'error' });
      return;
    }

    setRuntimeHub(response.runtimeHub);
    setBanner({ message: 'Override confirmed. Rule bypassed.', tone: 'success' });
  }

  async function handleCancelOverride() {
    const response = await cancelRuntimeOverride();
    if (!response.ok) {
      setBanner({ message: response.message, tone: 'error' });
      return;
    }

    setRuntimeHub(response.runtimeHub);
    setBanner({ message: 'Override request cancelled.', tone: 'success' });
  }

  return {
    activePath,
    activeSectionId,
    authLoading,
    banner,
    email,
    password,
    refreshing,
    runtime,
    runtimeHub,
    user,
    view,
    actions: {
      handleArmToggle,
      handleCancelOverride,
      handleConfirmOverride,
      handleLogin,
      handleLogout,
      handlePreferenceToggle,
      handleRuntimeRefresh,
      handleSidebarNavigate,
      handleViolationAction,
      setEmail,
      setPassword
    }
  };
}
