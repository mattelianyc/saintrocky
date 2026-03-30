import mongoose from 'mongoose';

const { Mixed } = mongoose.Schema.Types;

const UserRuleSchema = new mongoose.Schema(
  {
    ruleId: { type: String, required: true, unique: true, index: true },
    ownerUserId: { type: String, required: true, index: true },
    ownerDisplayName: { type: String, default: '' },
    ownerEmail: { type: String, required: true, index: true },
    ownerRole: { type: String, default: 'member' },
    source: { type: String, required: true },
    templateId: { type: String, default: null },
    templateKey: { type: String, default: null },
    draftId: { type: String, default: null },
    status: { type: String, required: true, index: true },
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    problemIndex: { type: Number, default: 50, min: 0, max: 100 },
    lockedStakeLamports: { type: Number, default: 0 },
    config: { type: Mixed, default: {} },
    compiledRule: { type: Mixed, default: null },
    bypassPolicy: { type: Mixed, default: null },
    enforcementSurfaces: { type: [String], default: [] },
    pendingEdit: { type: Mixed, default: null },
    editHistory: { type: [Mixed], default: [] },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true, index: true },
    lastRuntimeEventAt: { type: String, default: null },
    lastRuntimeEventType: { type: String, default: null }
  },
  { versionKey: false }
);

export const UserRule = mongoose.models.UserRule || mongoose.model('UserRule', UserRuleSchema);
