export const FRIENDSHIP_STATUSES = ['pending', 'accepted', 'declined', 'blocked'];
export const CAMPAIGN_STATUSES = ['draft', 'active', 'completed', 'cancelled'];
export const CAMPAIGN_MEMBERSHIP_STATUSES = ['invited', 'active', 'declined', 'left', 'removed'];
export const MAX_DIRECT_MESSAGE_LENGTH = 1000;
export const MAX_CAMPAIGN_RULES = 10;

export function isKnownFriendshipStatus(status) {
  return FRIENDSHIP_STATUSES.includes(status);
}

export function isKnownCampaignStatus(status) {
  return CAMPAIGN_STATUSES.includes(status);
}

export function isKnownCampaignMembershipStatus(status) {
  return CAMPAIGN_MEMBERSHIP_STATUSES.includes(status);
}

export function buildConversationId(firstUserId, secondUserId) {
  return [String(firstUserId || ''), String(secondUserId || '')]
    .map((value) => value.trim())
    .filter(Boolean)
    .sort()
    .join('__');
}
