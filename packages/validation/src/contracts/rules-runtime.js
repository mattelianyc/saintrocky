import {
  RULE_EDIT_TIMING_OPTIONS,
  RULE_BYPASS_FEE_MODELS,
  RULE_RUNTIME_EVENT_TYPES,
  RULE_RUNTIME_SURFACES,
  RULE_SCHEDULE_TYPES,
  RULE_CHAIN_CONSTRAINT_TYPES,
  RULE_USER_RULE_STATUSES,
  getRuleTemplateById
} from '@saintrocky/shared';

function buildResult(ok, errors = []) {
  return { ok, errors };
}

function addError(errors, field, message) {
  errors.push({ field, message });
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateTargets(targets, errors) {
  if (!Array.isArray(targets)) {
    addError(errors, 'compiledRule.targets', 'targets must be an array');
    return;
  }

  targets.forEach((target, index) => {
    if (!isPlainObject(target)) {
      addError(errors, `compiledRule.targets[${index}]`, 'Each target must be an object');
      return;
    }

    const validTargetTypes = ['domain', 'app'];
    if (!validTargetTypes.includes(target.type)) {
      addError(errors, `compiledRule.targets[${index}].type`, `type must be one of: ${validTargetTypes.join(', ')}`);
    }

    if (!isNonEmptyString(target.value)) {
      addError(errors, `compiledRule.targets[${index}].value`, 'value is required');
    }
  });
}

function validateSchedule(schedule, errors) {
  if (!isPlainObject(schedule)) {
    addError(errors, 'compiledRule.schedule', 'schedule must be an object');
    return;
  }

  if (!RULE_SCHEDULE_TYPES.includes(schedule.type)) {
    addError(errors, 'compiledRule.schedule.type', `type must be one of: ${RULE_SCHEDULE_TYPES.join(', ')}`);
  }

  if (schedule.type === 'window') {
    if (!Array.isArray(schedule.windows) || schedule.windows.length === 0) {
      addError(errors, 'compiledRule.schedule.windows', 'windows array is required for window schedule');
    }
  }

  if (schedule.type === 'cooldown') {
    if (typeof schedule.durationMinutes !== 'number' || schedule.durationMinutes <= 0) {
      addError(errors, 'compiledRule.schedule.durationMinutes', 'durationMinutes must be a positive number');
    }
  }
}

function validateChainConstraints(chainConstraints, errors) {
  if (chainConstraints === null || chainConstraints === undefined) return;

  if (!isPlainObject(chainConstraints)) {
    addError(errors, 'compiledRule.chainConstraints', 'chainConstraints must be an object or null');
    return;
  }

  if (!isNonEmptyString(chainConstraints.type)) {
    addError(errors, 'compiledRule.chainConstraints.type', 'chainConstraints.type is required');
  }
}

export function validateCompiledRule(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return buildResult(false, [{ field: 'compiledRule', message: 'compiledRule must be an object' }]);
  }

  if (!isNonEmptyString(payload.summary)) {
    addError(errors, 'compiledRule.summary', 'summary is required');
  }

  validateTargets(payload.targets || [], errors);
  validateSchedule(payload.schedule || {}, errors);
  validateChainConstraints(payload.chainConstraints, errors);

  if (!isPlainObject(payload.enforcement)) {
    addError(errors, 'compiledRule.enforcement', 'enforcement is required');
  } else {
    if (!isNonEmptyString(payload.enforcement.action)) {
      addError(errors, 'compiledRule.enforcement.action', 'action is required');
    }

    if (!isNonEmptyString(payload.enforcement.userMessage)) {
      addError(errors, 'compiledRule.enforcement.userMessage', 'userMessage is required');
    }
  }

  if (!isPlainObject(payload.bypass)) {
    addError(errors, 'compiledRule.bypass', 'bypass is required');
  } else {
    if (typeof payload.bypass.allowed !== 'boolean') {
      addError(errors, 'compiledRule.bypass.allowed', 'allowed must be a boolean');
    }

    if (!RULE_BYPASS_FEE_MODELS.includes(payload.bypass.feeModel)) {
      addError(
        errors,
        'compiledRule.bypass.feeModel',
        `feeModel must be one of: ${RULE_BYPASS_FEE_MODELS.join(', ')}`
      );
    }
  }

  if (!isPlainObject(payload.telemetry)) {
    addError(errors, 'compiledRule.telemetry', 'telemetry is required');
  }

  return buildResult(errors.length === 0, errors);
}

export function validateTemplateRuleCreation(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return buildResult(false, [{ field: 'body', message: 'Request body must be an object' }]);
  }

  if (!isNonEmptyString(payload.templateId)) {
    addError(errors, 'templateId', 'templateId is required');
  } else if (!getRuleTemplateById(payload.templateId)) {
    addError(errors, 'templateId', 'templateId is not recognized');
  }

  if (payload.ownerEmail != null && !isNonEmptyString(payload.ownerEmail)) {
    addError(errors, 'ownerEmail', 'ownerEmail must be a non-empty string');
  }

  if (!isPlainObject(payload.config)) {
    addError(errors, 'config', 'config must be an object');
  }

  return buildResult(errors.length === 0, errors);
}

export function validateUserRuleStatusUpdate(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return buildResult(false, [{ field: 'body', message: 'Request body must be an object' }]);
  }

  if (!isNonEmptyString(payload.ruleId)) {
    addError(errors, 'ruleId', 'ruleId is required');
  }

  if (!RULE_USER_RULE_STATUSES.includes(payload.status)) {
    addError(errors, 'status', `status must be one of: ${RULE_USER_RULE_STATUSES.join(', ')}`);
  }

  return buildResult(errors.length === 0, errors);
}

export function validateUserRuleEdit(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return buildResult(false, [{ field: 'body', message: 'Request body must be an object' }]);
  }

  if (!isNonEmptyString(payload.ruleId)) {
    addError(errors, 'ruleId', 'ruleId is required');
  }

  if (!isPlainObject(payload.config)) {
    addError(errors, 'config', 'config must be an object');
  }

  if (!RULE_EDIT_TIMING_OPTIONS.includes(payload.editTimingOption)) {
    addError(errors, 'editTimingOption', `editTimingOption must be one of: ${RULE_EDIT_TIMING_OPTIONS.join(', ')}`);
  }

  return buildResult(errors.length === 0, errors);
}

export function validateRuntimeRuleEvent(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return buildResult(false, [{ field: 'body', message: 'Request body must be an object' }]);
  }

  if (!isNonEmptyString(payload.ruleId)) {
    addError(errors, 'ruleId', 'ruleId is required');
  }

  if (!RULE_RUNTIME_SURFACES.includes(payload.runtimeSurface)) {
    addError(errors, 'runtimeSurface', `runtimeSurface must be one of: ${RULE_RUNTIME_SURFACES.join(', ')}`);
  }

  if (!RULE_RUNTIME_EVENT_TYPES.includes(payload.eventType)) {
    addError(errors, 'eventType', `eventType must be one of: ${RULE_RUNTIME_EVENT_TYPES.join(', ')}`);
  }

  if (payload.occurredAt != null && !isNonEmptyString(payload.occurredAt)) {
    addError(errors, 'occurredAt', 'occurredAt must be a non-empty string');
  }

  if (payload.ownerEmail != null && !isNonEmptyString(payload.ownerEmail)) {
    addError(errors, 'ownerEmail', 'ownerEmail must be a non-empty string');
  }

  if (payload.details != null && !isPlainObject(payload.details)) {
    addError(errors, 'details', 'details must be an object');
  }

  return buildResult(errors.length === 0, errors);
}
