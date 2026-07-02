import mongoose from 'mongoose';

const { Mixed } = mongoose.Schema.Types;

const ChainTradeSchema = new mongoose.Schema(
  {
    signature: { type: String, required: true, unique: true, index: true },
    walletAddress: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    programId: { type: String, required: true },
    direction: { type: String, enum: ['buy', 'sell', 'swap', 'unknown'], required: true },
    tokenMint: { type: String, default: null },
    solAmount: { type: Number, required: true },
    timestamp: { type: Date, required: true, index: true },
    isViolation: { type: Boolean, default: false },
    violationIds: { type: [String], default: [] },
    violationDetails: { type: [Mixed], default: [] },
    fee: { type: Number, default: 0 },
    raw: { type: Mixed, default: {} }
  },
  { versionKey: false }
);

export const ChainTrade =
  mongoose.models.ChainTrade || mongoose.model('ChainTrade', ChainTradeSchema);
