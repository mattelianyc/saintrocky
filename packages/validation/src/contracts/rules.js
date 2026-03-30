import {
  RULE_BYPASS_FEE_MODELS,
  RULE_CONFIDENCE_THRESHOLD,
  RULE_DRAFT_STATUSES,
  RULE_ENFORCEMENT_ACTIONS,
  RULE_ENFORCEMENT_SURFACES
} from '@saintrocky/shared';
import {
  PROBLEM_INDEX_MAX,
  PROBLEM_INDEX_MIN
} from '@saintrocky/fuckyoupayme';
import { validateCompiledRule } from './rules-runtime.js';

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

function isValidConfidenceScore(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isValidProblemIndex(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= PROBLEM_INDEX_MIN &&
    value <= PROBLEM_INDEX_MAX
  );
}

function validateStringArray(value, field, errors) {
  if (!Array.isArray(value)) {
    addError(errors, field, `${field} must be an array`);
    return;
  }

  value.forEach((entry, index) => {
    if (!isNonEmptyString(entry)) {
      addError(errors, `${field}[${index}]`, `${field}[${index}] must be a non-empty string`);
    }
  });
}

function validateClarificationQuestions(value, errors) {
  if (!Array.isArray(value)) {
    addError(errors, 'clarificationQuestions', 'clarificationQuestions must be an array');
    return;
  }

  value.forEach((entry, index) => {
    if (!isPlainObject(entry)) {
      addError(errors, `clarificationQuestions[${index}]`, 'Each clarification question must be an object');
      return;
    }

    if (!isNonEmptyString(entry.id)) {
      addError(errors, `clarificationQuestions[${index}].id`, 'Question id is required');
    }

    if (!isNonEmptyString(entry.question)) {
      addError(errors, `clarificationQuestions[${index}].question`, 'Question text is required');
    }
  });
}

export function validateRuleDraftSubmission(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return buildResult(false, [{ field: 'body', message: 'Request body must be an object' }]);
  }

  if (!isNonEmptyString(payload.naturalLanguageDraft)) {
    addError(errors, 'naturalLanguageDraft', 'naturalLanguageDraft is required');
  }

  if (payload.draftId != null && !isNonEmptyString(payload.draftId)) {
    addError(errors, 'draftId', 'draftId must be a non-empty string');
  }

  if (payload.authorEmail != null && !isNonEmptyString(payload.authorEmail)) {
    addError(errors, 'authorEmail', 'authorEmail must be a non-empty string');
  }

  if (payload.problemIndex != null && !isValidProblemIndex(payload.problemIndex)) {
    addError(
      errors,
      'problemIndex',
      `problemIndex must be a number between ${PROBLEM_INDEX_MIN} and ${PROBLEM_INDEX_MAX}`
    );
  }

  if (payload.clarificationAnswers != null) {
    if (!Array.isArray(payload.clarificationAnswers)) {
      addError(errors, 'clarificationAnswers', 'clarificationAnswers must be an array');
    } else {
      payload.clarificationAnswers.forEach((entry, index) => {
        if (!isPlainObject(entry)) {
          addError(errors, `clarificationAnswers[${index}]`, 'Each clarification answer must be an object');
          return;
        }

        if (!isNonEmptyString(entry.questionId)) {
          addError(errors, `clarificationAnswers[${index}].questionId`, 'questionId is required');
        }

        if (!isNonEmptyString(entry.answer)) {
          addError(errors, `clarificationAnswers[${index}].answer`, 'answer is required');
        }
      });
    }
  }

  return buildResult(errors.length === 0, errors);
}

export function validateCanonicalRule(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return buildResult(false, [{ field: 'canonicalRule', message: 'canonicalRule must be an object' }]);
  }

  if (!isNonEmptyString(payload.intent)) {
    addError(errors, 'canonicalRule.intent', 'intent is required');
  }

  if (!isNonEmptyString(payload.summary)) {
    addError(errors, 'canonicalRule.summary', 'summary is required');
  }

  if (!Array.isArray(payload.targets)) {
    addError(errors, 'canonicalRule.targets', 'targets must be an array');
  }

  if (payload.schedule != null && !isPlainObject(payload.schedule)) {
    addError(errors, 'canonicalRule.schedule', 'schedule must be an object');
  }

  if (!isPlainObject(payload.enforcement)) {
    addError(errors, 'canonicalRule.enforcement', 'enforcement is required');
  } else {
    if (!RULE_ENFORCEMENT_ACTIONS.includes(payload.enforcement.action)) {
      addError(
        errors,
        'canonicalRule.enforcement.action',
        `action must be one of: ${RULE_ENFORCEMENT_ACTIONS.join(', ')}`
      );
    }

    if (!isNonEmptyString(payload.enforcement.userMessage)) {
      addError(errors, 'canonicalRule.enforcement.userMessage', 'enforcement.userMessage is required');
    }
  }

  if (!isPlainObject(payload.bypass)) {
    addError(errors, 'canonicalRule.bypass', 'bypass is required');
  } else {
    if (typeof payload.bypass.allowed !== 'boolean') {
      addError(errors, 'canonicalRule.bypass.allowed', 'bypass.allowed must be a boolean');
    }

    if (!RULE_BYPASS_FEE_MODELS.includes(payload.bypass.feeModel)) {
      addError(
        errors,
        'canonicalRule.bypass.feeModel',
        `feeModel must be one of: ${RULE_BYPASS_FEE_MODELS.join(', ')}`
      );
    }

    if (payload.bypass.allowed && payload.bypass.feeModel === 'none') {
      addError(errors, 'canonicalRule.bypass.feeModel', 'Allowed bypasses need a fee model');
    }
  }

  if (payload.unresolvedQuestions != null) {
    validateStringArray(payload.unresolvedQuestions, 'canonicalRule.unresolvedQuestions', errors);
  }

  return buildResult(errors.length === 0, errors);
}

export function validateRuleDraftAssessment(payload) {
  const errors = [];

  if (!isPlainObject(payload)) {
    return buildResult(false, [{ field: 'assessment', message: 'assessment must be an object' }]);
  }

  if (!RULE_DRAFT_STATUSES.includes(payload.status)) {
    addError(errors, 'status', `status must be one of: ${RULE_DRAFT_STATUSES.join(', ')}`);
  }

  if (!isNonEmptyString(payload.naturalLanguageDraft)) {
    addError(errors, 'naturalLanguageDraft', 'naturalLanguageDraft is required');
  }

  if (!isValidConfidenceScore(payload.confidenceScore)) {
    addError(errors, 'confidenceScore', 'confidenceScore must be a number between 0 and 1');
  }

  if (payload.clarificationQuestions != null) {
    validateClarificationQuestions(payload.clarificationQuestions, errors);
  }

  if (payload.validationNotes != null) {
    validateStringArray(payload.validationNotes, 'validationNotes', errors);
  }

  if (payload.canonicalRule != null) {
    const canonicalRuleResult = validateCanonicalRule(payload.canonicalRule);
    errors.push(...canonicalRuleResult.errors);
  }

  if (payload.compiledRule != null) {
    const compiledRuleResult = validateCompiledRule(payload.compiledRule);
    errors.push(...compiledRuleResult.errors);
  }

  if (payload.status === 'needs_clarification' && !(payload.clarificationQuestions || []).length) {
    addError(
      errors,
      'clarificationQuestions',
      'clarificationQuestions are required when status is needs_clarification'
    );
  }

  if (payload.status === 'rejected_unenforceable' && !(payload.validationNotes || []).length) {
    addError(errors, 'validationNotes', 'validationNotes are required when status is rejected_unenforceable');
  }

  const requiresCanonicalRule =
    payload.status === 'validated_enforceable' || payload.status === 'ready_for_activation';

  if (requiresCanonicalRule && !payload.compiledRule) {
    addError(errors, 'compiledRule', 'compiledRule is required when the rule is enforceable');
  }

  if (requiresCanonicalRule && payload.confidenceScore !== RULE_CONFIDENCE_THRESHOLD) {
    addError(
      errors,
      'confidenceScore',
      `confidenceScore must equal ${RULE_CONFIDENCE_THRESHOLD} before a rule can be accepted`
    );
  }

  return buildResult(errors.length === 0, errors);
}
