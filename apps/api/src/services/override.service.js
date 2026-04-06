import { randomUUID } from 'node:crypto';

import {
  calculateLockedStake,
  calculateOverrideFee,
  clampProblemIndex,
  FREE_OVERRIDE_AFTER_HOURS,
  WITHDRAWAL_COOLDOWN_HOURS
} from '@saintrocky/fuckyoupayme';
import { getScheduleWindowEndTime } from '@saintrocky/enforcement';

import { OverrideRequest } from '../models/override-request.model.js';
import { WalletLink } from '../models/wallet-link.model.js';
import { getInitializedEscrowVault, recordPenaltyLamportsOnChain } from './escrow.service.js';
import { isValidSolanaPublicKey } from '../utils/solana.js';
import {
  assertRuleRecordAccess,
  canManageMemberRules,
  resolveRuleActor
} from './rules-access.service.js';
import { getUserRuleById, saveUserRule } from './rule-runtime-store.service.js';
import { publishOwnerRuleState } from './rules.service.js';

function buildRequestError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.payload = { ok: false, code, message };
  return error;
}

function serializeRequest(request, quote) {
  return {
    requestId: request.requestId,
    requestKind: request.requestKind,
    ruleId: request.ruleId,
    userId: request.userId,
    userEmail: request.userEmail,
    walletAddress: request.walletAddress,
    vaultAddress: request.vaultAddress,
    problemIndex: request.problemIndex,
    lockedStakeLamports: request.lockedStakeLamports,
    feeLamports: request.feeLamports,
    requestedAt: request.requestedAt,
    freeAt: request.freeAt,
    status: request.status,
    confirmedAt: request.confirmedAt,
    overrideExpiresAt: request.overrideExpiresAt || null,
    cancelledAt: request.cancelledAt,
    transactionSignature: request.transactionSignature,
    metadata: request.metadata || {},
    currentQuote: quote
  };
}

async function getRuleForActor(ruleId, actor) {
  const resolvedActor = await resolveRuleActor(actor);
  const rule = await getUserRuleById(ruleId);
  if (!rule) {
    throw buildRequestError(404, 'NOT_FOUND', 'Rule not found');
  }

  assertRuleRecordAccess(resolvedActor, rule.ownerEmail);
  return { actor: resolvedActor, rule };
}

async function getLinkedWalletForRule(rule) {
  const linkedWallets = await WalletLink.find({
    userId: rule.ownerUserId,
    chain: 'solana'
  })
    .sort({ isPrimary: -1, linkedAt: 1 })
    .lean();

  for (const linkedWallet of linkedWallets) {
    if (!linkedWallet?.walletAddress) {
      continue;
    }

    if (!(await isValidSolanaPublicKey(linkedWallet.walletAddress))) {
      continue;
    }

    const initializedVault = await getInitializedEscrowVault(linkedWallet.walletAddress);
    if (initializedVault?.address) {
      return linkedWallet;
    }
  }

  throw buildRequestError(
    409,
    'WALLET_REQUIRED',
    'Link a valid Solana wallet and create its escrow vault before requesting an override.'
  );
}

async function resolveChargeableWalletForRequest(request, rule) {
  if (await isValidSolanaPublicKey(request.walletAddress)) {
    const storedWallet = await WalletLink.findOne({
      userId: rule.ownerUserId,
      walletAddress: request.walletAddress,
      chain: 'solana'
    }).lean();

    if (storedWallet) {
      const initializedVault = await getInitializedEscrowVault(storedWallet.walletAddress);
      if (initializedVault?.address) {
        return storedWallet;
      }
    }
  }

  return getLinkedWalletForRule(rule);
}

function buildQuoteFromRequest(request, now = new Date()) {
  return calculateOverrideFee({
    problemIndex: request.problemIndex,
    lockedStakeLamports: request.lockedStakeLamports,
    requestedAt: request.requestedAt,
    now
  });
}

function buildOverrideExpiryDate(schedule, confirmedAt = new Date()) {
  const confirmedAtDate = confirmedAt instanceof Date ? confirmedAt : new Date(confirmedAt);
  if (Number.isNaN(confirmedAtDate.getTime())) {
    return null;
  }

  const scheduleWindowEndTime = getScheduleWindowEndTime(schedule, confirmedAtDate);
  if (scheduleWindowEndTime instanceof Date && !Number.isNaN(scheduleWindowEndTime.getTime())) {
    return scheduleWindowEndTime;
  }

  return new Date(confirmedAtDate.getTime() + FREE_OVERRIDE_AFTER_HOURS * 60 * 60 * 1000);
}

export async function listPendingRuleChangeRequestsByRuleId(ruleIds = []) {
  const normalizedRuleIds = Array.from(
    new Set(
      (Array.isArray(ruleIds) ? ruleIds : [])
        .map((ruleId) => String(ruleId || '').trim())
        .filter(Boolean)
    )
  );

  if (!normalizedRuleIds.length) {
    return {};
  }

  const pendingRequests = await OverrideRequest.find({
    ruleId: { $in: normalizedRuleIds },
    status: 'pending'
  })
    .sort({ requestedAt: -1 })
    .lean();

  return pendingRequests.reduce((requestsByRuleId, request) => {
    const currentEntry = requestsByRuleId[request.ruleId] || {
      override: null,
      deactivation: null
    };

    if (!currentEntry[request.requestKind]) {
      currentEntry[request.requestKind] = serializeRequest(
        request,
        buildQuoteFromRequest(request)
      );
    }

    requestsByRuleId[request.ruleId] = currentEntry;
    return requestsByRuleId;
  }, {});
}

export async function listActiveOverridesByRuleId(ruleIds = [], now = new Date()) {
  const normalizedRuleIds = Array.from(
    new Set(
      (Array.isArray(ruleIds) ? ruleIds : [])
        .map((ruleId) => String(ruleId || '').trim())
        .filter(Boolean)
    )
  );

  if (!normalizedRuleIds.length) {
    return {};
  }

  const nowIso = (now instanceof Date ? now : new Date(now)).toISOString();
  const activeOverrides = await OverrideRequest.find({
    ruleId: { $in: normalizedRuleIds },
    requestKind: 'override',
    status: 'confirmed',
    overrideExpiresAt: { $gt: nowIso }
  })
    .sort({ confirmedAt: -1 })
    .lean();

  return activeOverrides.reduce((overridesByRuleId, request) => {
    if (!overridesByRuleId[request.ruleId]) {
      overridesByRuleId[request.ruleId] = {
        requestId: request.requestId,
        confirmedAt: request.confirmedAt || null,
        overrideExpiresAt: request.overrideExpiresAt || null
      };
    }

    return overridesByRuleId;
  }, {});
}

async function ensureNoPendingRequest(ruleId, requestKind) {
  const existingRequest = await OverrideRequest.findOne({
    ruleId,
    requestKind,
    status: 'pending'
  }).lean();

  if (existingRequest) {
    throw buildRequestError(
      409,
      'OVERRIDE_ALREADY_PENDING',
      'A pending request already exists for this rule.'
    );
  }
}

function getSupportedTargetStatus(targetStatus) {
  const normalizedTargetStatus = String(targetStatus || 'paused');
  if (!['paused', 'archived'].includes(normalizedTargetStatus)) {
    throw buildRequestError(400, 'BAD_REQUEST', 'targetStatus must be paused or archived.');
  }

  return normalizedTargetStatus;
}

export async function requestRuleOverride(payload = {}) {
  const { actor, rule } = await getRuleForActor(payload.ruleId, payload.actor);
  if (rule.status !== 'active') {
    throw buildRequestError(409, 'RULE_NOT_ACTIVE', 'Only active rules can be overridden.');
  }

  if (rule.bypassPolicy?.allowed === false) {
    throw buildRequestError(409, 'BYPASS_DISABLED', 'This rule does not allow overrides.');
  }

  await ensureNoPendingRequest(rule.ruleId, 'override');
  const wallet = await getLinkedWalletForRule(rule);
  const problemIndex = clampProblemIndex(rule.problemIndex);
  const lockedStakeLamports = rule.lockedStakeLamports || calculateLockedStake(problemIndex);

  const requestedAt = new Date();
  const quote = calculateOverrideFee({
    problemIndex,
    lockedStakeLamports,
    requestedAt
  });

  const request = await OverrideRequest.create({
    requestId: randomUUID(),
    requestKind: 'override',
    ruleId: rule.ruleId,
    userId: rule.ownerUserId,
    userEmail: rule.ownerEmail,
    walletAddress: wallet.walletAddress,
    vaultAddress: wallet.escrowVaultAddress,
    problemIndex,
    lockedStakeLamports,
    feeLamports: quote.feeLamports,
    requestedAt: quote.requestedAt,
    freeAt: quote.freeAt,
    status: 'pending',
    metadata: {
      summary: rule.summary,
      actorEmail: actor.email,
      withdrawalCooldownHours: WITHDRAWAL_COOLDOWN_HOURS
    }
  });

  await publishOwnerRuleState(rule.ownerUserId, rule.ownerEmail, 'override_requested', {
    ruleId: rule.ruleId,
    requestId: request.requestId
  });

  return {
    ok: true,
    request: serializeRequest(request.toObject(), quote)
  };
}

export async function requestRuleDeactivation(payload = {}) {
  const { actor, rule } = await getRuleForActor(payload.ruleId, payload.actor);
  if (rule.status !== 'active') {
    throw buildRequestError(409, 'RULE_NOT_ACTIVE', 'Only active rules can be deactivated through the cooldown flow.');
  }

  await ensureNoPendingRequest(rule.ruleId, 'deactivation');
  const wallet = await getLinkedWalletForRule(rule);
  const targetStatus = getSupportedTargetStatus(payload.targetStatus);
  const problemIndex = clampProblemIndex(rule.problemIndex);
  const lockedStakeLamports = rule.lockedStakeLamports || calculateLockedStake(problemIndex);

  const requestedAt = new Date();
  const quote = calculateOverrideFee({
    problemIndex,
    lockedStakeLamports,
    requestedAt
  });

  const request = await OverrideRequest.create({
    requestId: randomUUID(),
    requestKind: 'deactivation',
    ruleId: rule.ruleId,
    userId: rule.ownerUserId,
    userEmail: rule.ownerEmail,
    walletAddress: wallet.walletAddress,
    vaultAddress: wallet.escrowVaultAddress,
    problemIndex,
    lockedStakeLamports,
    feeLamports: quote.feeLamports,
    requestedAt: quote.requestedAt,
    freeAt: quote.freeAt,
    status: 'pending',
    metadata: {
      summary: rule.summary,
      actorEmail: actor.email,
      targetStatus
    }
  });

  await publishOwnerRuleState(rule.ownerUserId, rule.ownerEmail, 'deactivation_requested', {
    ruleId: rule.ruleId,
    requestId: request.requestId
  });

  return {
    ok: true,
    request: serializeRequest(request.toObject(), quote)
  };
}

export async function getRuleChangeRequest(payload = {}) {
  const { actor, rule } = await getRuleForActor(payload.ruleId, payload.actor);
  const request = await OverrideRequest.findOne({
    requestId: payload.requestId,
    ruleId: rule.ruleId,
    requestKind: payload.requestKind
  }).lean();

  if (!request) {
    throw buildRequestError(404, 'NOT_FOUND', 'Request not found.');
  }

  if (!canManageMemberRules(actor) && request.userEmail !== actor.email) {
    throw buildRequestError(403, 'FORBIDDEN', 'Not allowed to view this request.');
  }

  return {
    ok: true,
    request: serializeRequest(request, buildQuoteFromRequest(request))
  };
}

export async function confirmRuleChangeRequest(payload = {}) {
  const { actor, rule } = await getRuleForActor(payload.ruleId, payload.actor);
  const request = await OverrideRequest.findOne({
    requestId: payload.requestId,
    ruleId: rule.ruleId,
    requestKind: payload.requestKind
  });

  if (!request) {
    throw buildRequestError(404, 'NOT_FOUND', 'Request not found.');
  }

  if (request.status !== 'pending') {
    throw buildRequestError(409, 'REQUEST_NOT_PENDING', 'Only pending requests can be confirmed.');
  }

  if (!canManageMemberRules(actor) && request.userEmail !== actor.email) {
    throw buildRequestError(403, 'FORBIDDEN', 'Not allowed to confirm this request.');
  }

  const quote = buildQuoteFromRequest(request.toObject());
  let transactionSignature = null;
  const chargeableWallet = await resolveChargeableWalletForRequest(request, rule);

  request.walletAddress = chargeableWallet.walletAddress;
  request.vaultAddress = chargeableWallet.escrowVaultAddress;

  if (quote.feeLamports > 0) {
    const penaltyResult = await recordPenaltyLamportsOnChain({
      walletAddress: chargeableWallet.walletAddress,
      violationId: `${request.requestKind}:${request.ruleId}:${request.requestId}`,
      amountLamports: quote.feeLamports
    });

    if (!penaltyResult?.transaction) {
      throw buildRequestError(502, 'ON_CHAIN_PENALTY_FAILED', 'Failed to settle the override fee on-chain.');
    }

    transactionSignature = penaltyResult.transaction;
  }

  if (request.requestKind === 'deactivation') {
    const targetStatus = getSupportedTargetStatus(request.metadata?.targetStatus);
    await saveUserRule({
      ...rule,
      status: targetStatus,
      updatedAt: new Date().toISOString()
    });
  }

  request.status = 'confirmed';
  request.confirmedAt = new Date().toISOString();
  request.overrideExpiresAt =
    request.requestKind === 'override'
      ? buildOverrideExpiryDate(rule.compiledRule?.schedule, request.confirmedAt)?.toISOString() || null
      : null;
  request.feeLamports = quote.feeLamports;
  request.transactionSignature = transactionSignature;
  await request.save();

  await publishOwnerRuleState(rule.ownerUserId, rule.ownerEmail, `${request.requestKind}_confirmed`, {
    ruleId: rule.ruleId,
    requestId: request.requestId
  });

  return {
    ok: true,
    request: serializeRequest(request.toObject(), quote),
    rule:
      request.requestKind === 'deactivation'
        ? {
            ...rule,
            status: getSupportedTargetStatus(request.metadata?.targetStatus)
          }
        : rule
  };
}

export async function cancelRuleChangeRequest(payload = {}) {
  const { actor, rule } = await getRuleForActor(payload.ruleId, payload.actor);
  const request = await OverrideRequest.findOne({
    requestId: payload.requestId,
    ruleId: rule.ruleId,
    requestKind: payload.requestKind
  });

  if (!request) {
    throw buildRequestError(404, 'NOT_FOUND', 'Request not found.');
  }

  if (request.status !== 'pending') {
    throw buildRequestError(409, 'REQUEST_NOT_PENDING', 'Only pending requests can be cancelled.');
  }

  if (!canManageMemberRules(actor) && request.userEmail !== actor.email) {
    throw buildRequestError(403, 'FORBIDDEN', 'Not allowed to cancel this request.');
  }

  request.status = 'cancelled';
  request.cancelledAt = new Date().toISOString();
  await request.save();

  await publishOwnerRuleState(rule.ownerUserId, rule.ownerEmail, `${payload.requestKind}_cancelled`, {
    ruleId: rule.ruleId,
    requestId: request.requestId
  });

  return {
    ok: true,
    request: serializeRequest(request.toObject(), buildQuoteFromRequest(request.toObject()))
  };
}

export async function settleMeteredViolationPenalty(payload = {}) {
  const { actor, rule } = await getRuleForActor(payload.ruleId, payload.actor);
  const normalizedAmountLamports = Math.max(0, Math.round(Number(payload.amountLamports) || 0));
  if (!payload.violationId) {
    throw buildRequestError(400, 'BAD_REQUEST', 'violationId is required.');
  }

  if (normalizedAmountLamports <= 0) {
    return {
      ok: true,
      ruleId: rule.ruleId,
      violationId: String(payload.violationId),
      amountLamports: 0,
      transactionSignature: null,
      meterStartedAt: payload.meterStartedAt || null,
      meterEndedAt: payload.meterEndedAt || null,
      matchedTargets: Array.isArray(payload.matchedTargets) ? payload.matchedTargets : []
    };
  }

  if (!canManageMemberRules(actor) && rule.ownerEmail !== actor.email) {
    throw buildRequestError(403, 'FORBIDDEN', 'Not allowed to settle this metered penalty.');
  }

  const chargeableWallet = await getLinkedWalletForRule(rule);
  const penaltyResult = await recordPenaltyLamportsOnChain({
    walletAddress: chargeableWallet.walletAddress,
    violationId: String(payload.violationId),
    amountLamports: normalizedAmountLamports
  });

  if (!penaltyResult?.transaction) {
    throw buildRequestError(502, 'ON_CHAIN_PENALTY_FAILED', 'Failed to settle the metered penalty on-chain.');
  }

  await publishOwnerRuleState(rule.ownerUserId, rule.ownerEmail, 'metered_penalty_recorded', {
    ruleId: rule.ruleId,
    violationId: String(payload.violationId),
    amountLamports: normalizedAmountLamports,
    meterStartedAt: payload.meterStartedAt || null,
    meterEndedAt: payload.meterEndedAt || null,
    matchedTargets: Array.isArray(payload.matchedTargets) ? payload.matchedTargets : []
  });

  return {
    ok: true,
    ruleId: rule.ruleId,
    violationId: String(payload.violationId),
    amountLamports: normalizedAmountLamports,
    transactionSignature: penaltyResult.transaction,
    meterStartedAt: payload.meterStartedAt || null,
    meterEndedAt: payload.meterEndedAt || null,
    matchedTargets: Array.isArray(payload.matchedTargets) ? payload.matchedTargets : []
  };
}
