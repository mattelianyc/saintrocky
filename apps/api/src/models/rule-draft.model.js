import mongoose from 'mongoose';

const { Mixed } = mongoose.Schema.Types;

const RuleDraftSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    authorUserId: { type: String, required: true, index: true },
    authorDisplayName: { type: String, default: '' },
    authorEmail: { type: String, required: true, index: true },
    authorRole: { type: String, default: 'member' },
    status: { type: String, required: true, index: true },
    statusHistory: { type: [Mixed], default: [] },
    naturalLanguageDraft: { type: String, default: '' },
    clarificationAnswers: { type: [Mixed], default: [] },
    clarificationQuestions: { type: [Mixed], default: [] },
    compiledRule: { type: Mixed, default: null },
    enforcementSurface: { type: String, default: null },
    enforcementAction: { type: String, default: null },
    bypassAllowed: { type: Boolean, default: false },
    bypassFeeModel: { type: String, default: 'none' },
    confidenceScore: { type: Number, default: 0 },
    validationNotes: { type: [String], default: [] },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true, index: true }
  },
  { versionKey: false }
);

export const RuleDraft = mongoose.models.RuleDraft || mongoose.model('RuleDraft', RuleDraftSchema);
