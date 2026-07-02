export const RULE_EDIT_TIMING_OPTIONS = ['instant', 'delay_1h', 'delay_6h', 'delay_24h'];

export const RULE_EDIT_TIMING_OPTION_LABELS = {
  instant: 'Instant',
  delay_1h: '1 hour',
  delay_6h: '6 hours',
  delay_24h: '24 hours'
};

const RULE_EDIT_TIMING_QUOTE_MAP = {
  instant: {
    delayHours: 0,
    feeSol: 0.24,
    description: 'Edit goes live immediately for the highest priority fee.'
  },
  delay_1h: {
    delayHours: 1,
    feeSol: 0.08,
    description: 'Edit goes live in one hour for a smaller fee.'
  },
  delay_6h: {
    delayHours: 6,
    feeSol: 0.03,
    description: 'Edit goes live later today for a minimal fee.'
  },
  delay_24h: {
    delayHours: 24,
    feeSol: 0,
    description: 'Edit goes live after 24 hours for free.'
  }
};

export function isKnownRuleEditTimingOption(value) {
  return RULE_EDIT_TIMING_OPTIONS.includes(String(value || ''));
}

export function getRuleEditTimingQuote(timingOption = 'delay_24h', requestedAt = new Date()) {
  const normalizedTimingOption = isKnownRuleEditTimingOption(timingOption) ? timingOption : 'delay_24h';
  const quote = RULE_EDIT_TIMING_QUOTE_MAP[normalizedTimingOption];
  const requestedAtDate = requestedAt instanceof Date ? requestedAt : new Date(requestedAt);
  const effectiveAtDate = new Date(requestedAtDate.getTime() + quote.delayHours * 60 * 60 * 1000);

  return {
    timingOption: normalizedTimingOption,
    label: RULE_EDIT_TIMING_OPTION_LABELS[normalizedTimingOption],
    delayHours: quote.delayHours,
    feeSol: quote.feeSol,
    paymentRequired: quote.feeSol > 0,
    requestedAt: requestedAtDate.toISOString(),
    effectiveAt: effectiveAtDate.toISOString(),
    description: quote.description
  };
}
