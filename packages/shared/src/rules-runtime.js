import { RULE_BYPASS_FEE_MODELS } from './rule-authoring.js';

export const RULE_RUNTIME_SURFACES = ['browser_extension', 'desktop_runtime', 'chain_watcher'];

export const RULE_RUNTIME_SURFACE_LABELS = {
  browser_extension: 'Browser extension',
  desktop_runtime: 'Desktop runtime',
  chain_watcher: 'On-chain monitor'
};

/**
 * Human-readable surface line for UI when compiled rules no longer carry `runtimeSurface`
 * (infer from `targets` and `chainConstraints`).
 */
export function formatCompiledRuleSurfaceLabel(compiledRule) {
  if (!compiledRule) {
    return 'Unassigned';
  }

  const targets = Array.isArray(compiledRule.targets) ? compiledRule.targets : [];
  const hasDomain = targets.some((entry) => entry.type === 'domain');
  const hasApp = targets.some((entry) => entry.type === 'app');
  const hasChain = compiledRule.chainConstraints != null;

  const parts = [];
  if (hasDomain) {
    parts.push(RULE_RUNTIME_SURFACE_LABELS.browser_extension);
  }
  if (hasApp) {
    parts.push(RULE_RUNTIME_SURFACE_LABELS.desktop_runtime);
  }
  if (hasChain) {
    parts.push(RULE_RUNTIME_SURFACE_LABELS.chain_watcher);
  }

  if (!parts.length) {
    return 'Unassigned';
  }

  return parts.join(' · ');
}

export const RULE_RUNTIME_CAPABILITIES = [
  'browser_domain_blocking',
  'browser_navigation_intercept',
  'desktop_app_focus',
  'desktop_process_visibility',
  'desktop_notification_delivery',
  'chain_trade_detection',
  'chain_position_analysis',
  'chain_token_age_lookup'
];

export const RULE_TEMPLATE_CATEGORIES = [
  'trade_limits',
  'schedule_discipline',
  'risk_management',
  'fomo_protection',
  'manual_lock'
];

export const RULE_TEMPLATE_CATEGORY_LABELS = {
  trade_limits: 'Trade limits',
  schedule_discipline: 'Schedule discipline',
  risk_management: 'Risk management',
  fomo_protection: 'FOMO protection',
  manual_lock: 'Manual lock'
};

export const RULE_SCHEDULE_TYPES = ['always', 'window', 'manual_lock', 'cooldown'];

export const RULE_CHAIN_CONSTRAINT_TYPES = [
  'max_trades_per_day',
  'max_position_size',
  'max_daily_loss',
  'min_token_age',
  'blocked_tokens',
  'cooldown_after_loss'
];

export const RULE_USER_RULE_STATUSES = ['draft', 'active', 'paused', 'archived', 'blocked_unenforceable'];

export const RULE_USER_RULE_STATUS_LABELS = {
  draft: 'Draft',
  active: 'Active',
  paused: 'Paused',
  archived: 'Archived',
  blocked_unenforceable: 'Blocked unenforceable'
};

export const RULE_USER_RULE_SOURCES = ['template', 'ai_authored'];

export const RULE_RUNTIME_EVENT_TYPES = [
  'rule_triggered',
  'rule_blocked',
  'rule_warning',
  'bypass_offered',
  'bypass_accepted',
  'bypass_declined',
  'chain_violation_detected',
  'escrow_penalty_applied'
];

function splitCommaSeparatedList(value) {
  return String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function buildTargetsFromDomains(domainsCsv) {
  return splitCommaSeparatedList(domainsCsv).map((domain) => ({ type: 'domain', value: domain }));
}

function buildTargetsFromApps(appsCsv) {
  return splitCommaSeparatedList(appsCsv).map((app) => ({ type: 'app', value: app }));
}

function buildCompiledRuleBase(template, summary) {
  return {
    summary,
    targets: [],
    chainConstraints: null,
    schedule: { type: 'always' },
    enforcement: {
      action: 'block',
      userMessage: template.userMessageTemplate
    },
    bypass: {
      allowed: true,
      feeModel: 'escrow_deduction',
      escrowDeductionBps: 100
    },
    telemetry: {
      templateId: template.templateId,
      category: template.category,
      source: 'template'
    }
  };
}

export const foundationalRuleTemplates = [
  {
    templateId: 'template-max-trades-per-day',
    key: 'max-trades-per-day',
    title: 'Max trades per day',
    summary: 'Limit how many trades you can execute in a single day.',
    category: 'trade_limits',
    inputSchema: {
      fields: [
        { key: 'maxTrades', label: 'Max trades per day', type: 'number', required: true },
        { key: 'blockedDomains', label: 'Trading domains to block after limit', type: 'text', required: false }
      ]
    },
    defaultConfig: {
      maxTrades: 5,
      blockedDomains: 'pump.fun, jup.ag, raydium.io'
    },
    userMessageTemplate: "You've hit your daily trade limit. Pay to override or wait until tomorrow."
  },
  {
    templateId: 'template-max-position-size',
    key: 'max-position-size',
    title: 'Max position size',
    summary: 'Cap the SOL amount of any single trade.',
    category: 'risk_management',
    inputSchema: {
      fields: [
        { key: 'maxPositionSizeSol', label: 'Max position size (SOL)', type: 'number', required: true }
      ]
    },
    defaultConfig: {
      maxPositionSizeSol: 2
    },
    userMessageTemplate: 'This trade exceeds your maximum position size. Pay to override.'
  },
  {
    templateId: 'template-no-trading-during-hours',
    key: 'no-trading-during-hours',
    title: 'No trading during hours',
    summary: 'Block all trading sites and detect on-chain activity during restricted hours.',
    category: 'schedule_discipline',
    inputSchema: {
      fields: [
        { key: 'blockedStart', label: 'Block start time', type: 'time', required: true },
        { key: 'blockedEnd', label: 'Block end time', type: 'time', required: true },
        { key: 'timezone', label: 'Timezone', type: 'text', required: true },
        { key: 'blockedDomains', label: 'Domains to block', type: 'text', required: false },
        { key: 'blockedApps', label: 'Apps to block', type: 'text', required: false }
      ]
    },
    defaultConfig: {
      blockedStart: '00:00',
      blockedEnd: '06:00',
      timezone: 'America/New_York',
      blockedDomains: 'pump.fun, jup.ag, raydium.io',
      blockedApps: 'Phantom, Solflare'
    },
    userMessageTemplate: 'Trading is blocked during this time window. Pay to override.'
  },
  {
    templateId: 'template-no-fomo-buys',
    key: 'no-fomo-buys',
    title: 'No FOMO buys on fresh tokens',
    summary: 'Block buying any token younger than a configured age.',
    category: 'fomo_protection',
    inputSchema: {
      fields: [
        { key: 'minTokenAgeHours', label: 'Minimum token age (hours)', type: 'number', required: true }
      ]
    },
    defaultConfig: {
      minTokenAgeHours: 1
    },
    userMessageTemplate: 'This token is too new. Pay to override the FOMO protection.'
  },
  {
    templateId: 'template-cooldown-after-loss',
    key: 'cooldown-after-loss',
    title: 'Cooldown after a loss',
    summary: 'Lock all trading for a cooldown period after a losing trade.',
    category: 'risk_management',
    inputSchema: {
      fields: [
        { key: 'cooldownMinutes', label: 'Cooldown minutes', type: 'number', required: true },
        { key: 'blockedDomains', label: 'Domains to block during cooldown', type: 'text', required: false },
        { key: 'blockedApps', label: 'Apps to block during cooldown', type: 'text', required: false }
      ]
    },
    defaultConfig: {
      cooldownMinutes: 30,
      blockedDomains: 'pump.fun, jup.ag, raydium.io',
      blockedApps: 'Phantom, Solflare'
    },
    userMessageTemplate: 'Your cooldown is active after a loss. Pay to override.'
  },
  {
    templateId: 'template-max-daily-loss',
    key: 'max-daily-loss',
    title: 'Max daily loss',
    summary: 'Stop trading after losing a configured amount of SOL in a day.',
    category: 'risk_management',
    inputSchema: {
      fields: [
        { key: 'maxDailyLossSol', label: 'Max daily loss (SOL)', type: 'number', required: true },
        { key: 'blockedDomains', label: 'Domains to block after limit', type: 'text', required: false }
      ]
    },
    defaultConfig: {
      maxDailyLossSol: 5,
      blockedDomains: 'pump.fun, jup.ag, raydium.io'
    },
    userMessageTemplate: "You've hit your daily loss limit. Pay to override or wait until tomorrow."
  },
  {
    templateId: 'template-block-tokens',
    key: 'block-tokens',
    title: 'Block specific tokens',
    summary: 'Prevent yourself from trading specific token mints.',
    category: 'fomo_protection',
    inputSchema: {
      fields: [
        { key: 'blockedMints', label: 'Token mint addresses (comma-separated)', type: 'text', required: true }
      ]
    },
    defaultConfig: {
      blockedMints: ''
    },
    userMessageTemplate: 'This token is on your blocked list. Pay to override.'
  },
  {
    templateId: 'template-manual-trading-lock',
    key: 'manual-trading-lock',
    title: 'Manual trading lock',
    summary: 'Arm a hard lock on all trading surfaces. Pay to unlock.',
    category: 'manual_lock',
    inputSchema: {
      fields: [
        { key: 'blockedDomains', label: 'Domains to lock', type: 'text', required: false },
        { key: 'blockedApps', label: 'Apps to lock', type: 'text', required: false },
        { key: 'lockLabel', label: 'Lock label', type: 'text', required: false }
      ]
    },
    defaultConfig: {
      blockedDomains: 'pump.fun, jup.ag, raydium.io',
      blockedApps: 'Phantom, Solflare',
      lockLabel: 'Manual hard lock'
    },
    userMessageTemplate: 'Your manual lock is active. Pay to override.'
  },
  {
    templateId: 'template-block-domains-on-schedule',
    key: 'block-domains-on-schedule',
    title: 'Block domains on a schedule',
    summary: 'Block any domains during a time window. Universal -- works for any site.',
    category: 'schedule_discipline',
    inputSchema: {
      fields: [
        { key: 'blockedDomains', label: 'Domains to block', type: 'text', required: true },
        { key: 'sessionStart', label: 'Block start time', type: 'time', required: true },
        { key: 'sessionEnd', label: 'Block end time', type: 'time', required: true },
        { key: 'timezone', label: 'Timezone', type: 'text', required: true }
      ]
    },
    defaultConfig: {
      blockedDomains: 'amazon.com, doordash.com, ubereats.com',
      sessionStart: '22:00',
      sessionEnd: '06:00',
      timezone: 'America/New_York'
    },
    userMessageTemplate: 'This site is blocked during this time. Pay to override.'
  },
  {
    templateId: 'template-block-apps-on-schedule',
    key: 'block-apps-on-schedule',
    title: 'Block apps on a schedule',
    summary: 'Block any desktop apps during a time window.',
    category: 'schedule_discipline',
    inputSchema: {
      fields: [
        { key: 'blockedApps', label: 'Apps to block', type: 'text', required: true },
        { key: 'sessionStart', label: 'Block start time', type: 'time', required: true },
        { key: 'sessionEnd', label: 'Block end time', type: 'time', required: true },
        { key: 'timezone', label: 'Timezone', type: 'text', required: true }
      ]
    },
    defaultConfig: {
      blockedApps: 'Discord, Slack, Steam',
      sessionStart: '09:00',
      sessionEnd: '17:00',
      timezone: 'America/New_York'
    },
    userMessageTemplate: 'This app is blocked during this time. Pay to override.'
  }
];

export function getRuleTemplateById(templateId) {
  return foundationalRuleTemplates.find((template) => template.templateId === templateId) || null;
}

export function buildCompiledRuleFromTemplate(template, config = {}) {
  const resolvedConfig = { ...template.defaultConfig, ...(config || {}) };
  const key = template.key;

  if (key === 'max-trades-per-day') {
    const maxTrades = Number(resolvedConfig.maxTrades) || 5;
    const compiled = buildCompiledRuleBase(template, `Max ${maxTrades} trades per day.`);
    compiled.targets = buildTargetsFromDomains(resolvedConfig.blockedDomains);
    compiled.chainConstraints = { type: 'max_trades_per_day', maxTrades };
    return compiled;
  }

  if (key === 'max-position-size') {
    const maxSol = Number(resolvedConfig.maxPositionSizeSol) || 2;
    const compiled = buildCompiledRuleBase(template, `Max position size: ${maxSol} SOL.`);
    compiled.chainConstraints = { type: 'max_position_size', maxPositionSizeSol: maxSol };
    return compiled;
  }

  if (key === 'no-trading-during-hours') {
    const compiled = buildCompiledRuleBase(
      template,
      `No trading ${resolvedConfig.blockedStart}-${resolvedConfig.blockedEnd} (${resolvedConfig.timezone}).`
    );
    compiled.targets = [
      ...buildTargetsFromDomains(resolvedConfig.blockedDomains),
      ...buildTargetsFromApps(resolvedConfig.blockedApps)
    ];
    compiled.schedule = {
      type: 'window',
      windows: [{
        start: resolvedConfig.blockedStart,
        end: resolvedConfig.blockedEnd,
        timezone: resolvedConfig.timezone
      }]
    };
    compiled.chainConstraints = { type: 'schedule_violation' };
    return compiled;
  }

  if (key === 'no-fomo-buys') {
    const minHours = Number(resolvedConfig.minTokenAgeHours) || 1;
    const compiled = buildCompiledRuleBase(template, `No buying tokens younger than ${minHours}h.`);
    compiled.chainConstraints = { type: 'min_token_age', minTokenAgeHours: minHours };
    return compiled;
  }

  if (key === 'cooldown-after-loss') {
    const minutes = Number(resolvedConfig.cooldownMinutes) || 30;
    const compiled = buildCompiledRuleBase(template, `${minutes}min cooldown after a loss.`);
    compiled.targets = [
      ...buildTargetsFromDomains(resolvedConfig.blockedDomains),
      ...buildTargetsFromApps(resolvedConfig.blockedApps)
    ];
    compiled.schedule = { type: 'cooldown', durationMinutes: minutes, armed: false, armedAt: null };
    compiled.chainConstraints = { type: 'cooldown_after_loss', cooldownMinutes: minutes };
    return compiled;
  }

  if (key === 'max-daily-loss') {
    const maxLoss = Number(resolvedConfig.maxDailyLossSol) || 5;
    const compiled = buildCompiledRuleBase(template, `Max daily loss: ${maxLoss} SOL.`);
    compiled.targets = buildTargetsFromDomains(resolvedConfig.blockedDomains);
    compiled.chainConstraints = { type: 'max_daily_loss', maxDailyLossSol: maxLoss };
    return compiled;
  }

  if (key === 'block-tokens') {
    const mints = splitCommaSeparatedList(resolvedConfig.blockedMints);
    const compiled = buildCompiledRuleBase(template, `Block ${mints.length} token(s).`);
    compiled.chainConstraints = { type: 'blocked_tokens', blockedMints: mints };
    return compiled;
  }

  if (key === 'manual-trading-lock') {
    const compiled = buildCompiledRuleBase(
      template,
      `Manual lock: ${resolvedConfig.lockLabel || 'trading lock'}.`
    );
    compiled.targets = [
      ...buildTargetsFromDomains(resolvedConfig.blockedDomains),
      ...buildTargetsFromApps(resolvedConfig.blockedApps)
    ];
    compiled.schedule = { type: 'manual_lock', armed: false, lockLabel: resolvedConfig.lockLabel };
    return compiled;
  }

  if (key === 'block-domains-on-schedule') {
    const domains = splitCommaSeparatedList(resolvedConfig.blockedDomains);
    const compiled = buildCompiledRuleBase(
      template,
      `Block ${domains.join(', ')} ${resolvedConfig.sessionStart}-${resolvedConfig.sessionEnd}.`
    );
    compiled.targets = buildTargetsFromDomains(resolvedConfig.blockedDomains);
    compiled.schedule = {
      type: 'window',
      windows: [{
        start: resolvedConfig.sessionStart,
        end: resolvedConfig.sessionEnd,
        timezone: resolvedConfig.timezone
      }]
    };
    return compiled;
  }

  if (key === 'block-apps-on-schedule') {
    const apps = splitCommaSeparatedList(resolvedConfig.blockedApps);
    const compiled = buildCompiledRuleBase(
      template,
      `Block ${apps.join(', ')} ${resolvedConfig.sessionStart}-${resolvedConfig.sessionEnd}.`
    );
    compiled.targets = buildTargetsFromApps(resolvedConfig.blockedApps);
    compiled.schedule = {
      type: 'window',
      windows: [{
        start: resolvedConfig.sessionStart,
        end: resolvedConfig.sessionEnd,
        timezone: resolvedConfig.timezone
      }]
    };
    return compiled;
  }

  return buildCompiledRuleBase(template, template.summary);
}

export function isWithinTimeWindow(window) {
  if (!window?.start || !window?.end) return false;
  const now = new Date();
  const tz = window.timezone || 'UTC';

  let currentTime;
  try {
    currentTime = now.toLocaleTimeString('en-US', { hour12: false, timeZone: tz, hour: '2-digit', minute: '2-digit' });
  } catch {
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    currentTime = `${hours}:${minutes}`;
  }

  const { start, end } = window;

  if (start <= end) {
    return currentTime >= start && currentTime < end;
  }
  return currentTime >= start || currentTime < end;
}

export function isScheduleActive(schedule = {}) {
  if (!schedule?.type || schedule.type === 'always') return true;

  if (schedule.type === 'manual_lock') {
    return schedule.armed === true;
  }

  if (schedule.type === 'cooldown') {
    if (!schedule.armedAt) return false;
    const elapsed = Date.now() - new Date(schedule.armedAt).getTime();
    return elapsed < (schedule.durationMinutes || 0) * 60_000;
  }

  if (schedule.type === 'window') {
    return (schedule.windows || []).some(isWithinTimeWindow);
  }

  return false;
}

export function isKnownRuleRuntimeSurface(surface) {
  return RULE_RUNTIME_SURFACES.includes(String(surface || ''));
}

export function isKnownRuleRuntimeCapability(capability) {
  return RULE_RUNTIME_CAPABILITIES.includes(String(capability || ''));
}

export function isKnownRuleTemplateCategory(category) {
  return RULE_TEMPLATE_CATEGORIES.includes(String(category || ''));
}

export function isKnownUserRuleStatus(status) {
  return RULE_USER_RULE_STATUSES.includes(String(status || ''));
}

export function isKnownUserRuleSource(source) {
  return RULE_USER_RULE_SOURCES.includes(String(source || ''));
}

export function isKnownRuleRuntimeEventType(eventType) {
  return RULE_RUNTIME_EVENT_TYPES.includes(String(eventType || ''));
}

export function isKnownBypassFeeModelForRuntime(model) {
  return RULE_BYPASS_FEE_MODELS.includes(String(model || ''));
}

export function isKnownScheduleType(scheduleType) {
  return RULE_SCHEDULE_TYPES.includes(String(scheduleType || ''));
}

export function isKnownChainConstraintType(constraintType) {
  return RULE_CHAIN_CONSTRAINT_TYPES.includes(String(constraintType || ''));
}
