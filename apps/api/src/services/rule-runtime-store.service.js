import { RuleRuntimeEvent } from '@saintrocky/api/models/rule-runtime-event';
import { UserRule } from '@saintrocky/api/models/user-rule';

export async function saveUserRule(userRule) {
  return UserRule.findOneAndUpdate({ ruleId: userRule.ruleId }, userRule, {
    upsert: true,
    new: true,
    lean: true
  });
}

export async function getUserRuleById(ruleId) {
  return UserRule.findOne({ ruleId }).lean();
}

export async function listUserRules({ ownerUserId } = {}) {
  const filter = ownerUserId ? { ownerUserId } : {};
  return UserRule.find(filter).sort({ updatedAt: -1 }).lean();
}

export async function saveRuleRuntimeEvent(ruleRuntimeEvent) {
  return RuleRuntimeEvent.findOneAndUpdate({ eventId: ruleRuntimeEvent.eventId }, ruleRuntimeEvent, {
    upsert: true,
    new: true,
    lean: true
  });
}

export async function listRuleRuntimeEvents({ ruleId, ownerUserId } = {}) {
  const filter = {};

  if (ruleId) {
    filter.ruleId = ruleId;
  }

  if (ownerUserId) {
    filter.ownerUserId = ownerUserId;
  }

  return RuleRuntimeEvent.find(filter).sort({ occurredAt: -1 }).lean();
}
