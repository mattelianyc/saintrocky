import mongoose from 'mongoose';

const CampaignMembershipSchema = new mongoose.Schema(
  {
    membershipId: { type: String, required: true, unique: true, index: true },
    campaignId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    userDisplayName: { type: String, default: '' },
    invitedByUserId: { type: String, required: true, index: true },
    invitedByEmail: { type: String, required: true, index: true },
    role: { type: String, required: true, default: 'member' },
    status: { type: String, required: true, index: true, default: 'invited' },
    invitedAt: { type: String, required: true, index: true },
    respondedAt: { type: String, default: null },
    joinedAt: { type: String, default: null },
    leftAt: { type: String, default: null }
  },
  { versionKey: false }
);

export const CampaignMembership =
  mongoose.models.CampaignMembership ||
  mongoose.model('CampaignMembership', CampaignMembershipSchema);
