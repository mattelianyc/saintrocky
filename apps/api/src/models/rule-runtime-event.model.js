import mongoose from 'mongoose';

const { Mixed } = mongoose.Schema.Types;

const RuleRuntimeEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    ruleId: { type: String, required: true, index: true },
    ownerUserId: { type: String, required: true, index: true },
    ownerEmail: { type: String, required: true, index: true },
    runtimeSurface: { type: String, required: true, index: true },
    eventType: { type: String, required: true, index: true },
    occurredAt: { type: String, required: true, index: true },
    details: { type: Mixed, default: {} }
  },
  { versionKey: false }
);

export const RuleRuntimeEvent =
  mongoose.models.RuleRuntimeEvent || mongoose.model('RuleRuntimeEvent', RuleRuntimeEventSchema);
