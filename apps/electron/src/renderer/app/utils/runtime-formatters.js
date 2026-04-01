export function formatValue(value, fallback = 'Unavailable') {
  return value == null || value === '' ? fallback : String(value);
}

export function formatMonitorLabel(status) {
  return (
    {
      idle: 'Idle',
      armed: 'Armed',
      awaitingBypassDecision: 'Violation pending',
      overrideCountdown: 'Override countdown',
      overrideActive: 'Override active',
      enforcementGap: 'Enforcement gap',
      reconnecting: 'Reconnecting',
      disconnected: 'Disconnected'
    }[status] || status
  );
}

export function formatSurfaceLabel(surface) {
  return (
    {
      desktop: 'Desktop',
      chain: 'Chain',
      rules: 'Rules',
      friends: 'Social',
      direct_messages: 'Messages',
      campaigns: 'Campaigns'
    }[surface] || surface
  );
}

export function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
