export function formatValue(value, fallback = 'Unavailable') {
  return value == null || value === '' ? fallback : String(value);
}

export function formatMonitorLabel(status) {
  return (
    {
      idle: 'Idle',
      armed: 'Armed',
      awaitingBypassDecision: 'Violation pending',
      overrideActive: 'Override active',
      disconnected: 'Disconnected'
    }[status] || status
  );
}
