import mongoose from 'mongoose';

const { Mixed } = mongoose.Schema.Types;

const OverrideRequestSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    requestKind: { type: String, required: true, index: true, default: 'override' },
    ruleId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    walletAddress: { type: String, default: null },
    vaultAddress: { type: String, default: null },
    problemIndex: { type: Number, required: true, min: 0, max: 100 },
    lockedStakeLamports: { type: Number, required: true, default: 0 },
    feeLamports: { type: Number, default: 0 },
    requestedAt: { type: String, required: true, index: true },
    freeAt: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true, default: 'pending' },
    confirmedAt: { type: String, default: null },
    cancelledAt: { type: String, default: null },
    transactionSignature: { type: String, default: null },
    metadata: { type: Mixed, default: {} }
  },
  { versionKey: false }
);

export const OverrideRequest =
  mongoose.models.OverrideRequest || mongoose.model('OverrideRequest', OverrideRequestSchema);
