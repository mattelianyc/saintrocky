import mongoose from 'mongoose';

const FriendshipSchema = new mongoose.Schema(
  {
    friendshipId: { type: String, required: true, unique: true, index: true },
    requesterUserId: { type: String, required: true, index: true },
    requesterEmail: { type: String, required: true, index: true },
    requesterDisplayName: { type: String, default: '' },
    addresseeUserId: { type: String, required: true, index: true },
    addresseeEmail: { type: String, required: true, index: true },
    addresseeDisplayName: { type: String, default: '' },
    status: { type: String, required: true, index: true, default: 'pending' },
    requestedAt: { type: String, required: true, index: true },
    respondedAt: { type: String, default: null },
    acceptedAt: { type: String, default: null },
    declinedAt: { type: String, default: null },
    blockedAt: { type: String, default: null },
    blockedByUserId: { type: String, default: null },
    lastMessageAt: { type: String, default: null }
  },
  { versionKey: false }
);

export const Friendship =
  mongoose.models.Friendship || mongoose.model('Friendship', FriendshipSchema);
