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

export function formatRuleEventHeadline(event = {}) {
  const rulesEventType = event.eventType === 'runtime_event_recorded'
    ? event.details?.eventType || event.eventType
    : event.eventType;

  return (
    {
      rule_triggered: 'Rule triggered',
      bypass_offered: 'Override offered',
      bypass_accepted: 'Override countdown started',
      bypass_confirmed: 'Override confirmed',
      bypass_cancelled: 'Override cancelled',
      override_requested: 'Override countdown started',
      override_confirmed: 'Override confirmed',
      override_cancelled: 'Override cancelled',
      deactivation_requested: 'Rule cooldown started',
      deactivation_confirmed: 'Rule change confirmed',
      deactivation_cancelled: 'Rule change cancelled',
      rule_created: 'Rule created',
      rule_published: 'Rule published',
      rule_status_updated: 'Rule status changed',
      rule_edited: event.details?.pendingEdit ? 'Rule edit scheduled' : 'Rule edited',
      runtime_event_recorded: 'Runtime activity recorded'
    }[rulesEventType] || event.title || rulesEventType || 'Activity recorded'
  );
}

export function formatRuleEventMeta(event = {}) {
  if (event.details?.ruleId) {
    return `Rule ${event.details.ruleId}`;
  }

  if (event.ruleId) {
    return `Rule ${event.ruleId}`;
  }

  return '';
}
