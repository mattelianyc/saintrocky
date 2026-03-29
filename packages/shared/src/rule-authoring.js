export const RULE_DRAFT_STATUSES = [
  'draft_submitted',
  'needs_clarification',
  'validated_enforceable',
  'rejected_unenforceable',
  'ready_for_activation'
];

export const RULE_DRAFT_STATUS_LABELS = {
  draft_submitted: 'Draft submitted',
  needs_clarification: 'Needs clarification',
  validated_enforceable: 'Validated enforceable',
  rejected_unenforceable: 'Rejected unenforceable',
  ready_for_activation: 'Ready for activation'
};

export const RULE_ENFORCEMENT_SURFACES = [
  'browser_workflow',
  'network_policy',
  'desktop_session',
  'device',
  'alerts'
];

export const RULE_ENFORCEMENT_SURFACE_LABELS = {
  browser_workflow: 'Browser workflow',
  network_policy: 'Network policy',
  desktop_session: 'Desktop session',
  device: 'Device',
  alerts: 'Alerts'
};

export const RULE_ENFORCEMENT_ACTIONS = ['block', 'warn', 'log_only', 'step_up'];
export const RULE_BYPASS_FEE_MODELS = ['none', 'dynamic_override_fee', 'escrow_deduction'];
export const RULE_CONFIDENCE_THRESHOLD = 1;

export function isKnownRuleDraftStatus(status) {
  return RULE_DRAFT_STATUSES.includes(String(status || ''));
}

export function isKnownRuleSurface(surface) {
  return RULE_ENFORCEMENT_SURFACES.includes(String(surface || ''));
}

export function isKnownRuleAction(action) {
  return RULE_ENFORCEMENT_ACTIONS.includes(String(action || ''));
}

export function isKnownBypassFeeModel(model) {
  return RULE_BYPASS_FEE_MODELS.includes(String(model || ''));
}
