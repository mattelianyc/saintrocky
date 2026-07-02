import { randomUUID } from 'node:crypto';

import {
  getRuleEditTimingQuote,
  RULE_USER_RULE_STATUS_LABELS,
  buildCompiledRuleFromTemplate,
  foundationalRuleTemplates,
  getRuleTemplateById
} from '@saintrocky/shared';
import {
  calculateLockedStake,
  clampProblemIndex
} from '@saintrocky/fuckyoupayme';
import { buildRulesChannel, buildRuntimeChannel } from '@saintrocky/realtime';
import {
  classifyRuleEditDirection,
  mergeExpandingConfig
} from '@saintrocky/enforcement';
import {
  validateRuleDraftSubmission,
  validateRuntimeRuleEvent,
  validateTemplateRuleCreation,
  validateUserRuleEdit,
  validateUserRuleStatusUpdate
} from '@saintrocky/validation';

import { assessRuleDraft } from './rule-draft-ai.service.js';
import {
  assertRuleRecordAccess,
  canManageMemberRules,
  listManageableRuleOwners,
  resolveRequestedRuleOwner,
  resolveRuleActor
} from './rules-access.service.js';
import { getRuleDraftById, listRuleDrafts as listStoredRuleDrafts, saveRuleDraft } from './rule-draft-store.service.js';
import {
  findActiveUserRuleByTemplate,
  getUserRuleById,
  listRuleRuntimeEvents,
  listUserRules as listStoredUserRules,
  saveRuleRuntimeEvent,
  saveUserRule
} from './rule-runtime-store.service.js';
import { publishEvent, publishSnapshot } from './realtime.service.js';
import { listActiveOverridesByRuleId, listPendingRuleChangeRequestsByRuleId } from './override.service.js';
import { listUserWalletAddresses, resolveBrowserRuleEnforcementState } from './chain-rule-enforcement.service.js';

function buildValidationError(message, validation) {
  const error = new Error(message);
  error.status = 400;
  error.payload = {
    ok: false,
    code: 'BAD_REQUEST',
    errors: validation.errors
  };
  return error;
}

function buildNotFoundError(message) {
  const error = new Error(message);
  error.status = 404;
  error.payload = { ok: false, code: 'NOT_FOUND', message };
  return error;
}

function buildStatusHistoryEntry(status, details = {}) {
  return {
    status,
    at: new Date().toISOString(),
    ...details
  };
}

function inferRuntimeSurfaces(compiledRule) {
  const surfaces = [];
  const targets = compiledRule?.targets || [];
  if (targets.some((target) => target.type === 'domain')) surfaces.push('browser_extension');
  if (targets.some((target) => target.type === 'app')) surfaces.push('desktop_runtime');
  if (compiledRule?.chainConstraints) surfaces.push('chain_watcher');
  return surfaces;
}

function resolveProblemIndex(problemIndex, fallbackProblemIndex = 50) {
  const normalizedFallback = clampProblemIndex(fallbackProblemIndex);
  return problemIndex == null ? normalizedFallback : clampProblemIndex(problemIndex);
}

function buildRuleDraftRecord({ existingDraft, author, submission, assessment }) {
  const timestamp = new Date().toISOString();
  const statusHistory = [...(existingDraft?.statusHistory || [])];
  const problemIndex = resolveProblemIndex(
    submission.problemIndex,
    existingDraft?.problemIndex ?? 50
  );

  statusHistory.push(
    buildStatusHistoryEntry('draft_submitted', {
      note: existingDraft ? 'Draft resubmitted with clarification answers.' : 'Draft created.'
    })
  );

  if (assessment.status === 'validated_enforceable') {
    statusHistory.push(buildStatusHistoryEntry('validated_enforceable'));
    statusHistory.push(buildStatusHistoryEntry('ready_for_activation'));
  } else {
    statusHistory.push(buildStatusHistoryEntry(assessment.status));
  }

  const finalStatus = assessment.status === 'validated_enforceable' ? 'ready_for_activation' : assessment.status;

  return {
    id: existingDraft?.id || randomUUID(),
    authorUserId: author.id,
    authorDisplayName: author.displayName,
    authorEmail: author.email,
    authorRole: author.role,
    status: finalStatus,
    statusHistory,
    naturalLanguageDraft: submission.naturalLanguageDraft.trim(),
    clarificationAnswers: submission.clarificationAnswers || [],
    clarificationQuestions: assessment.clarificationQuestions || [],
    compiledRule: assessment.compiledRule || null,
    enforcementSurfaces: inferRuntimeSurfaces(assessment.compiledRule),
    enforcementAction: assessment.compiledRule?.enforcement?.action || null,
    bypassAllowed: assessment.compiledRule?.bypass?.allowed ?? false,
    bypassFeeModel: assessment.compiledRule?.bypass?.feeModel || 'none',
    problemIndex,
    lockedStakeLamports: calculateLockedStake(problemIndex),
    confidenceScore: assessment.confidenceScore,
    validationNotes: assessment.validationNotes || [],
    createdAt: existingDraft?.createdAt || timestamp,
    updatedAt: timestamp
  };
}

function buildUserRuleRecord({
  author,
  source,
  status = 'active',
  template = null,
  config = {},
  compiledRule,
  draftId,
  problemIndex = 50
}) {
  const timestamp = new Date().toISOString();
  const normalizedProblemIndex = resolveProblemIndex(problemIndex);

  return {
    ruleId: randomUUID(),
    ownerUserId: author.id,
    ownerDisplayName: author.displayName,
    ownerEmail: author.email,
    ownerRole: author.role,
    source,
    templateId: template?.templateId || null,
    templateKey: template?.key || null,
    draftId: draftId || null,
    status,
    title: template?.title || compiledRule.summary,
    summary: compiledRule.summary,
    problemIndex: normalizedProblemIndex,
    lockedStakeLamports: calculateLockedStake(normalizedProblemIndex),
    config,
    compiledRule,
    bypassPolicy: compiledRule.bypass,
    enforcementSurfaces: inferRuntimeSurfaces(compiledRule),
    pendingEdit: null,
    editHistory: [],
    createdAt: timestamp,
    updatedAt: timestamp,
    lastRuntimeEventAt: null,
    lastRuntimeEventType: null
  };
}

function buildEditHistoryEntry({
  timingQuote,
  actor,
  previousSummary,
  nextSummary,
  previousProblemIndex,
  nextProblemIndex,
  status
}) {
  return {
    editId: randomUUID(),
    status,
    timingOption: timingQuote.timingOption,
    feeSol: timingQuote.feeSol,
    paymentRequired: timingQuote.paymentRequired,
    requestedAt: timingQuote.requestedAt,
    effectiveAt: timingQuote.effectiveAt,
    requestedByEmail: actor.email,
    previousSummary,
    nextSummary,
    previousProblemIndex,
    nextProblemIndex
  };
}

function applyEditToRule({
  userRule,
  template,
  actor,
  nextConfig,
  nextCompiledRule,
  nextProblemIndex,
  nextLockedStakeLamports,
  timingQuote
}) {
  const nextSummary = nextCompiledRule.summary;
  const isImmediate = timingQuote.delayHours === 0;

  if (isImmediate) {
    return {
      ...userRule,
      title: template.title,
      summary: nextSummary,
      config: nextConfig,
      compiledRule: nextCompiledRule,
      bypassPolicy: nextCompiledRule.bypass,
      enforcementSurfaces: inferRuntimeSurfaces(nextCompiledRule),
      problemIndex: nextProblemIndex,
      lockedStakeLamports: nextLockedStakeLamports,
      pendingEdit: null,
      updatedAt: timingQuote.requestedAt,
      editHistory: [
        ...(userRule.editHistory || []),
        buildEditHistoryEntry({
          timingQuote,
          actor,
          previousSummary: userRule.summary,
          nextSummary,
          previousProblemIndex: userRule.problemIndex,
          nextProblemIndex,
          status: 'applied'
        })
      ]
    };
  }

  return {
    ...userRule,
    pendingEdit: {
      timingOption: timingQuote.timingOption,
      feeSol: timingQuote.feeSol,
      paymentRequired: timingQuote.paymentRequired,
      requestedAt: timingQuote.requestedAt,
      effectiveAt: timingQuote.effectiveAt,
      requestedByEmail: actor.email,
      title: template.title,
      summary: nextSummary,
      config: nextConfig,
      compiledRule: nextCompiledRule,
      problemIndex: nextProblemIndex,
      lockedStakeLamports: nextLockedStakeLamports
    },
    updatedAt: timingQuote.requestedAt,
    editHistory: [
      ...(userRule.editHistory || []),
      buildEditHistoryEntry({
        timingQuote,
        actor,
        previousSummary: userRule.summary,
        nextSummary,
        previousProblemIndex: userRule.problemIndex,
        nextProblemIndex,
        status: 'scheduled'
      })
    ]
  };
}

async function materializeDueRuleEdit(userRule) {
  if (!userRule?.pendingEdit?.effectiveAt) {
    return userRule;
  }

  if (new Date(userRule.pendingEdit.effectiveAt).getTime() > Date.now()) {
    return userRule;
  }

  const nextRule = {
    ...userRule,
    title: userRule.pendingEdit.title,
    summary: userRule.pendingEdit.summary,
    config: userRule.pendingEdit.config,
    compiledRule: userRule.pendingEdit.compiledRule,
    bypassPolicy: userRule.pendingEdit.compiledRule.bypass,
    enforcementSurfaces: inferRuntimeSurfaces(userRule.pendingEdit.compiledRule),
    problemIndex: userRule.pendingEdit.problemIndex ?? userRule.problemIndex,
    lockedStakeLamports:
      userRule.pendingEdit.lockedStakeLamports ?? userRule.lockedStakeLamports,
    pendingEdit: null,
    updatedAt: userRule.pendingEdit.effectiveAt,
    editHistory: [
      ...(userRule.editHistory || []),
      {
        editId: randomUUID(),
        status: 'applied',
        timingOption: userRule.pendingEdit.timingOption,
        feeSol: userRule.pendingEdit.feeSol,
        paymentRequired: userRule.pendingEdit.paymentRequired,
        requestedAt: userRule.pendingEdit.requestedAt,
        effectiveAt: userRule.pendingEdit.effectiveAt,
        requestedByEmail: userRule.pendingEdit.requestedByEmail,
        previousSummary: userRule.summary,
        nextSummary: userRule.pendingEdit.summary,
        previousProblemIndex: userRule.problemIndex,
        nextProblemIndex: userRule.pendingEdit.problemIndex ?? userRule.problemIndex
      }
    ]
  };

  await saveUserRule(nextRule);
  return nextRule;
}

async function attachRuleRuntimeSnapshot(userRule, options = {}) {
  const resolvedRule = await materializeDueRuleEdit(userRule);
  const latestEvent = (await listRuleRuntimeEvents({ ruleId: resolvedRule.ruleId }))[0] || null;
  const pendingRuleChangeRequests =
    options.pendingRequestsByRuleId?.[resolvedRule.ruleId] || {
      override: null,
      deactivation: null
    };
  const activeOverride = options.activeOverridesByRuleId?.[resolvedRule.ruleId] || null;
  const enforcementState = options.enforcementStatesByRuleId?.[resolvedRule.ruleId] || null;

  return {
    ...resolvedRule,
    statusLabel: RULE_USER_RULE_STATUS_LABELS[resolvedRule.status] || resolvedRule.status,
    latestRuntimeEvent: latestEvent,
    pendingRuleChangeRequests,
    activeOverride,
    enforcementState
  };
}

async function buildEnforcementStatesByRuleId(rules = [], ownerUserId = '') {
  if (!Array.isArray(rules) || rules.length === 0 || !ownerUserId) {
    return {};
  }

  const walletAddresses = await listUserWalletAddresses(ownerUserId);
  const enforcementEntries = await Promise.all(
    rules.map(async (rule) => [
      rule.ruleId,
      await resolveBrowserRuleEnforcementState(rule, walletAddresses)
    ])
  );

  return Object.fromEntries(enforcementEntries);
}

export async function publishOwnerRuleState(ownerUserId, ownerEmail, eventName, payload = {}) {
  const storedRules = await listStoredUserRules({ ownerUserId });
  const pendingRequestsByRuleId = await listPendingRuleChangeRequestsByRuleId(
    storedRules.map((rule) => rule.ruleId)
  );
  const activeOverridesByRuleId = await listActiveOverridesByRuleId(
    storedRules.map((rule) => rule.ruleId)
  );
  const enforcementStatesByRuleId = await buildEnforcementStatesByRuleId(storedRules, ownerUserId);
  const rules = await Promise.all(
    storedRules.map((rule) =>
      attachRuleRuntimeSnapshot(rule, { pendingRequestsByRuleId, activeOverridesByRuleId, enforcementStatesByRuleId })
    )
  );
  const drafts = await listStoredRuleDrafts({ authorUserId: ownerUserId });
  const activeRules = rules.filter((rule) => rule.status === 'active');

  publishSnapshot(buildRulesChannel(ownerEmail), { eventType: eventName, rules, drafts });
  publishEvent(buildRulesChannel(ownerEmail), eventName, payload);

  for (const surface of ['browser_extension', 'desktop_runtime', 'chain_watcher', 'mobile_observer']) {
    const assignments = activeRules
      .filter((rule) => {
        if (surface === 'mobile_observer') {
          return true;
        }

        return inferRuntimeSurfaces(rule.compiledRule).includes(surface);
      })
      .map((rule) => ({
        ruleId: rule.ruleId,
        ownerUserId: rule.ownerUserId,
        ownerEmail: rule.ownerEmail,
        compiledRule: rule.compiledRule,
        enforcementState: rule.enforcementState || null
      }));

    if (assignments.length > 0) {
      publishSnapshot(buildRuntimeChannel(ownerEmail, surface), {
        eventType: eventName,
        assignments
      });
      publishEvent(buildRuntimeChannel(ownerEmail, surface), eventName, payload);
    }
  }
}

export async function listRuleDrafts(payload = {}) {
  const actor = await resolveRuleActor(payload.actor);
  const author = await resolveRequestedRuleOwner(actor, payload.authorEmail);
  const authors = await listManageableRuleOwners(actor);
  const drafts = await listStoredRuleDrafts({ authorUserId: author.id });

  return {
    ok: true,
    author,
    authors,
    canManageMembers: canManageMemberRules(actor),
    drafts
  };
}

export async function getRuleDraft(payload = {}) {
  const actor = await resolveRuleActor(payload.actor);
  const author = await resolveRequestedRuleOwner(actor, payload.authorEmail);
  const draft = await getRuleDraftById(payload.ruleDraftId);

  if (!draft || draft.authorUserId !== author.id) {
    throw buildNotFoundError('Rule draft not found');
  }

  return { ok: true, author, draft };
}

export async function submitRuleDraft(payload = {}) {
  const validation = validateRuleDraftSubmission(payload);
  if (!validation.ok) {
    throw buildValidationError('Invalid rule draft submission', validation);
  }

  const actor = await resolveRuleActor(payload.actor);
  const author = await resolveRequestedRuleOwner(actor, payload.authorEmail);
  const existingDraft = payload.draftId ? await getRuleDraftById(payload.draftId) : null;
  if (existingDraft && existingDraft.authorUserId !== author.id) {
    const error = new Error('Rule draft does not belong to the selected author');
    error.status = 403;
    error.payload = { ok: false, code: 'FORBIDDEN', message: 'Rule draft does not belong to the selected author' };
    throw error;
  }

  const assessment = await assessRuleDraft({
    naturalLanguageDraft: payload.naturalLanguageDraft,
    clarificationAnswers: payload.clarificationAnswers || []
  });
  const draft = buildRuleDraftRecord({ existingDraft, author, submission: payload, assessment });
  await saveRuleDraft(draft);
  const authors = await listManageableRuleOwners(actor);
  await publishOwnerRuleState(author.id, author.email, 'rule_draft_updated', {
    draftId: draft.id,
    status: draft.status
  });

  return { ok: true, author, draft, authors, canManageMembers: canManageMemberRules(actor) };
}

export async function listRuleTemplates(payload = {}) {
  const actor = await resolveRuleActor(payload.actor);
  const authors = await listManageableRuleOwners(actor);

  return {
    ok: true,
    authors,
    canManageMembers: canManageMemberRules(actor),
    templates: foundationalRuleTemplates
  };
}

export async function listUserRules(payload = {}) {
  const actor = await resolveRuleActor(payload.actor);
  const owner = await resolveRequestedRuleOwner(actor, payload.ownerEmail);
  const storedRules = await listStoredUserRules({ ownerUserId: owner.id });
  const pendingRequestsByRuleId = await listPendingRuleChangeRequestsByRuleId(
    storedRules.map((rule) => rule.ruleId)
  );
  const activeOverridesByRuleId = await listActiveOverridesByRuleId(
    storedRules.map((rule) => rule.ruleId)
  );
  const enforcementStatesByRuleId = await buildEnforcementStatesByRuleId(storedRules, owner.id);
  const rules = await Promise.all(
    storedRules.map((rule) =>
      attachRuleRuntimeSnapshot(rule, { pendingRequestsByRuleId, activeOverridesByRuleId, enforcementStatesByRuleId })
    )
  );
  const drafts = await listStoredRuleDrafts({ authorUserId: owner.id });
  const owners = await listManageableRuleOwners(actor);

  return {
    ok: true,
    owner,
    owners,
    canManageMembers: canManageMemberRules(actor),
    rules,
    drafts
  };
}

export async function createUserRuleFromTemplate(payload = {}) {
  const validation = validateTemplateRuleCreation(payload);
  if (!validation.ok) {
    throw buildValidationError('Invalid template rule creation', validation);
  }

  const actor = await resolveRuleActor(payload.actor);
  const author = await resolveRequestedRuleOwner(actor, payload.ownerEmail);
  const template = getRuleTemplateById(payload.templateId);
  const incomingConfig = { ...template.defaultConfig, ...(payload.config || {}) };

  const existingRule = await findActiveUserRuleByTemplate(author.id, payload.templateId);
  if (existingRule) {
    const resolvedExisting = await materializeDueRuleEdit(existingRule);
    const baseConfig = resolvedExisting.pendingEdit?.config || resolvedExisting.config || {};
    const mergedConfig = mergeExpandingConfig(template, baseConfig, incomingConfig);
    const editClassification = classifyRuleEditDirection(template, baseConfig, mergedConfig);

    if (editClassification.direction === 'identical') {
      return {
        ok: true,
        merged: true,
        owner: author,
        rule: await attachRuleRuntimeSnapshot(resolvedExisting, {
          pendingRequestsByRuleId: await listPendingRuleChangeRequestsByRuleId([resolvedExisting.ruleId]),
          activeOverridesByRuleId: await listActiveOverridesByRuleId([resolvedExisting.ruleId]),
          enforcementStatesByRuleId: await buildEnforcementStatesByRuleId([resolvedExisting], author.id)
        })
      };
    }

    const nextCompiledRule = buildCompiledRuleFromTemplate(template, mergedConfig);
    const nextProblemIndex = resolveProblemIndex(payload.problemIndex, resolvedExisting.problemIndex);
    const nextLockedStakeLamports = calculateLockedStake(nextProblemIndex);
    const isExpanding = editClassification.direction === 'expanding';
    const timingQuote = isExpanding
      ? getRuleEditTimingQuote('instant', new Date())
      : getRuleEditTimingQuote(payload.editTimingOption || 'delay_24h', new Date());
    const freeInstantQuote = { ...timingQuote, feeSol: 0, paymentRequired: false };
    const effectiveQuote = isExpanding ? freeInstantQuote : timingQuote;

    const nextRule = applyEditToRule({
      userRule: resolvedExisting,
      template,
      actor,
      nextConfig: mergedConfig,
      nextCompiledRule,
      nextProblemIndex,
      nextLockedStakeLamports,
      timingQuote: effectiveQuote
    });

    await saveUserRule(nextRule);
    await publishOwnerRuleState(nextRule.ownerUserId, nextRule.ownerEmail, 'rule_edited', {
      ruleId: nextRule.ruleId,
      pendingEdit: Boolean(nextRule.pendingEdit)
    });

    return {
      ok: true,
      merged: true,
      editQuote: effectiveQuote,
      owner: author,
      rule: await attachRuleRuntimeSnapshot(nextRule, {
        pendingRequestsByRuleId: await listPendingRuleChangeRequestsByRuleId([nextRule.ruleId]),
        activeOverridesByRuleId: await listActiveOverridesByRuleId([nextRule.ruleId]),
        enforcementStatesByRuleId: await buildEnforcementStatesByRuleId([nextRule], author.id)
      })
    };
  }

  const compiledRule = buildCompiledRuleFromTemplate(template, incomingConfig);
  const userRule = buildUserRuleRecord({
    author,
    source: 'template',
    template,
    config: incomingConfig,
    compiledRule,
    problemIndex: payload.problemIndex
  });

  await saveUserRule(userRule);
  await publishOwnerRuleState(author.id, author.email, 'rule_created', {
    ruleId: userRule.ruleId
  });

  return {
    ok: true,
    merged: false,
    owner: author,
    rule: await attachRuleRuntimeSnapshot(userRule, {
      pendingRequestsByRuleId: await listPendingRuleChangeRequestsByRuleId([userRule.ruleId]),
      activeOverridesByRuleId: await listActiveOverridesByRuleId([userRule.ruleId]),
      enforcementStatesByRuleId: await buildEnforcementStatesByRuleId([userRule], author.id)
    })
  };
}

export async function publishRuleDraft(payload = {}) {
  const actor = await resolveRuleActor(payload.actor);
  const author = await resolveRequestedRuleOwner(actor, payload.ownerEmail);
  const draft = await getRuleDraftById(payload.draftId);
  if (!draft || draft.authorUserId !== author.id) {
    throw buildNotFoundError('Rule draft not found');
  }

  if (!draft.compiledRule || draft.status !== 'ready_for_activation') {
    const error = new Error('Rule draft is not ready to publish');
    error.status = 409;
    error.payload = { ok: false, code: 'RULE_NOT_READY', message: 'Rule draft is not ready to publish' };
    throw error;
  }

  const userRule = buildUserRuleRecord({
    author,
    source: 'ai_authored',
    compiledRule: draft.compiledRule,
    draftId: draft.id,
    problemIndex: draft.problemIndex
  });

  await saveUserRule(userRule);
  await publishOwnerRuleState(author.id, author.email, 'rule_published', {
    ruleId: userRule.ruleId,
    draftId: draft.id
  });

  return {
    ok: true,
    owner: author,
    rule: await attachRuleRuntimeSnapshot(userRule, {
      pendingRequestsByRuleId: await listPendingRuleChangeRequestsByRuleId([userRule.ruleId]),
      activeOverridesByRuleId: await listActiveOverridesByRuleId([userRule.ruleId]),
      enforcementStatesByRuleId: await buildEnforcementStatesByRuleId([userRule], author.id)
    }),
    draft
  };
}

export async function updateUserRuleStatus(payload = {}) {
  const validation = validateUserRuleStatusUpdate(payload);
  if (!validation.ok) {
    throw buildValidationError('Invalid rule status update', validation);
  }

  const actor = await resolveRuleActor(payload.actor);
  const userRule = await materializeDueRuleEdit(await getUserRuleById(payload.ruleId));
  if (!userRule) {
    throw buildNotFoundError('User rule not found');
  }

  assertRuleRecordAccess(actor, userRule.ownerEmail);

  if (
    userRule.status === 'active' &&
    ['paused', 'archived'].includes(payload.status)
  ) {
    const error = new Error(
      'Active rules must go through the sleep-on-it deactivation flow before they can be paused or archived.'
    );
    error.status = 409;
    error.payload = {
      ok: false,
      code: 'DEACTIVATION_REQUEST_REQUIRED',
      message:
        'Active rules must go through the sleep-on-it deactivation flow before they can be paused or archived.'
    };
    throw error;
  }

  const nextRule = {
    ...userRule,
    status: payload.status,
    updatedAt: new Date().toISOString()
  };

  await saveUserRule(nextRule);
  await publishOwnerRuleState(nextRule.ownerUserId, nextRule.ownerEmail, 'rule_status_updated', {
    ruleId: nextRule.ruleId,
    status: nextRule.status
  });

  return {
    ok: true,
    rule: await attachRuleRuntimeSnapshot(nextRule, {
      pendingRequestsByRuleId: await listPendingRuleChangeRequestsByRuleId([nextRule.ruleId]),
      activeOverridesByRuleId: await listActiveOverridesByRuleId([nextRule.ruleId]),
      enforcementStatesByRuleId: await buildEnforcementStatesByRuleId([nextRule], nextRule.ownerUserId)
    })
  };
}

export async function editUserRule(payload = {}) {
  const validation = validateUserRuleEdit(payload);
  if (!validation.ok) {
    throw buildValidationError('Invalid rule edit request', validation);
  }

  const actor = await resolveRuleActor(payload.actor);
  const userRule = await materializeDueRuleEdit(await getUserRuleById(payload.ruleId));
  if (!userRule) {
    throw buildNotFoundError('User rule not found');
  }

  assertRuleRecordAccess(actor, userRule.ownerEmail);

  if (!userRule.templateId) {
    const error = new Error('Only template-backed rules can be edited inline right now');
    error.status = 409;
    error.payload = {
      ok: false,
      code: 'RULE_NOT_EDITABLE',
      message: 'Only template-backed rules can be edited inline right now'
    };
    throw error;
  }

  const template = getRuleTemplateById(userRule.templateId);
  if (!template) {
    throw buildNotFoundError('Rule template not found');
  }

  const baseConfig = userRule.pendingEdit?.config || userRule.config || {};
  const nextConfig = { ...baseConfig, ...(payload.config || {}) };
  const nextCompiledRule = buildCompiledRuleFromTemplate(template, nextConfig);
  const nextProblemIndex = resolveProblemIndex(payload.problemIndex, userRule.problemIndex);
  const nextLockedStakeLamports = calculateLockedStake(nextProblemIndex);

  const editClassification = classifyRuleEditDirection(template, baseConfig, nextConfig);
  const isExpanding = editClassification.direction === 'expanding';
  const timingQuote = isExpanding
    ? { ...getRuleEditTimingQuote('instant', new Date()), feeSol: 0, paymentRequired: false }
    : getRuleEditTimingQuote(payload.editTimingOption, new Date());

  const nextRule = applyEditToRule({
    userRule,
    template,
    actor,
    nextConfig,
    nextCompiledRule,
    nextProblemIndex,
    nextLockedStakeLamports,
    timingQuote
  });

  await saveUserRule(nextRule);
  await publishOwnerRuleState(nextRule.ownerUserId, nextRule.ownerEmail, 'rule_edited', {
    ruleId: nextRule.ruleId,
    pendingEdit: Boolean(nextRule.pendingEdit)
  });

  return {
    ok: true,
    editQuote: timingQuote,
    editDirection: editClassification.direction,
    rule: await attachRuleRuntimeSnapshot(nextRule, {
      pendingRequestsByRuleId: await listPendingRuleChangeRequestsByRuleId([nextRule.ruleId]),
      activeOverridesByRuleId: await listActiveOverridesByRuleId([nextRule.ruleId]),
      enforcementStatesByRuleId: await buildEnforcementStatesByRuleId([nextRule], nextRule.ownerUserId)
    })
  };
}

export async function listRuntimeAssignments(payload = {}) {
  const actor = await resolveRuleActor(payload.actor);
  const capabilities = Array.isArray(payload.runtimeCapabilities) ? payload.runtimeCapabilities : [];
  const owner = await resolveRequestedRuleOwner(actor, payload.ownerEmail);
  const storedRules = await listStoredUserRules({ ownerUserId: owner.id });
  const resolvedRules = await Promise.all(storedRules.map(materializeDueRuleEdit));
  const enforcementStatesByRuleId = await buildEnforcementStatesByRuleId(resolvedRules, owner.id);
  const assignments = resolvedRules
    .filter(
      (rule) =>
        rule.status === 'active' &&
        (
          payload.runtimeSurface === 'mobile_observer' ||
          inferRuntimeSurfaces(rule.compiledRule).includes(payload.runtimeSurface)
        )
    )
    .map((rule) => ({
      ruleId: rule.ruleId,
      ownerUserId: rule.ownerUserId,
      ownerEmail: rule.ownerEmail,
      compiledRule: rule.compiledRule,
      enforcementState: enforcementStatesByRuleId[rule.ruleId] || null
    }));

  return {
    ok: true,
    runtimeSurface: payload.runtimeSurface,
    owner,
    assignments
  };
}

export async function reportRuntimeEvent(payload = {}) {
  const validation = validateRuntimeRuleEvent(payload);
  if (!validation.ok) {
    throw buildValidationError('Invalid runtime event', validation);
  }

  const actor = await resolveRuleActor(payload.actor);
  const userRule = await materializeDueRuleEdit(await getUserRuleById(payload.ruleId));
  if (!userRule) {
    throw buildNotFoundError('User rule not found');
  }

  assertRuleRecordAccess(actor, userRule.ownerEmail);

  const event = {
    eventId: randomUUID(),
    ruleId: userRule.ruleId,
    ownerUserId: userRule.ownerUserId,
    ownerEmail: userRule.ownerEmail,
    runtimeSurface: payload.runtimeSurface,
    eventType: payload.eventType,
    occurredAt: payload.occurredAt || new Date().toISOString(),
    details: payload.details || {}
  };

  await saveRuleRuntimeEvent(event);
  await saveUserRule({
    ...userRule,
    updatedAt: new Date().toISOString(),
    lastRuntimeEventAt: event.occurredAt,
    lastRuntimeEventType: event.eventType
  });
  await publishOwnerRuleState(userRule.ownerUserId, userRule.ownerEmail, 'runtime_event_recorded', {
    ruleId: userRule.ruleId,
    eventType: event.eventType
  });

  return {
    ok: true,
    event
  };
}
