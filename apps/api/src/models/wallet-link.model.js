import mongoose from 'mongoose';

const WalletLinkSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, index: true },
    walletAddress: { type: String, required: true, unique: true, index: true },
    chain: { type: String, default: 'solana' },
    label: { type: String, default: 'Primary' },
    isPrimary: { type: Boolean, default: true },
    escrowVaultAddress: { type: String, default: null },
    escrowBalanceLamports: { type: Number, default: 0 },
    heliusWebhookId: { type: String, default: null },
    linkedAt: { type: String, required: true },
    lastActivityAt: { type: String, default: null }
  },
  { versionKey: false }
);

export const WalletLink =
  mongoose.models.WalletLink || mongoose.model('WalletLink', WalletLinkSchema);
