import { RuleDraft } from '@saintrocky/api/models/rule-draft';

export async function saveRuleDraft(ruleDraft) {
  return RuleDraft.findOneAndUpdate({ id: ruleDraft.id }, ruleDraft, {
    upsert: true,
    new: true,
    lean: true
  });
}

export async function getRuleDraftById(ruleDraftId) {
  return RuleDraft.findOne({ id: ruleDraftId }).lean();
}

export async function listRuleDrafts({ authorUserId } = {}) {
  const filter = authorUserId ? { authorUserId } : {};
  return RuleDraft.find(filter).sort({ updatedAt: -1 }).lean();
}
