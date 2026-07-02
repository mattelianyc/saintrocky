import mongoose from 'mongoose';

const { Mixed } = mongoose.Schema.Types;

const CampaignSchema = new mongoose.Schema(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    ownerUserId: { type: String, required: true, index: true },
    ownerEmail: { type: String, required: true, index: true },
    ownerDisplayName: { type: String, default: '' },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, required: true, index: true, default: 'draft' },
    startsAt: { type: String, required: true, index: true },
    endsAt: { type: String, required: true, index: true },
    sharedRules: { type: [Mixed], default: [] },
    createdAt: { type: String, required: true, index: true },
    updatedAt: { type: String, required: true, index: true }
  },
  { versionKey: false }
);

export const Campaign =
  mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
