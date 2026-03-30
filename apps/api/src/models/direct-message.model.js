import mongoose from 'mongoose';

const DirectMessageSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    senderUserId: { type: String, required: true, index: true },
    senderEmail: { type: String, required: true, index: true },
    senderDisplayName: { type: String, default: '' },
    recipientUserId: { type: String, required: true, index: true },
    recipientEmail: { type: String, required: true, index: true },
    recipientDisplayName: { type: String, default: '' },
    body: { type: String, required: true },
    createdAt: { type: String, required: true, index: true },
    updatedAt: { type: String, required: true },
    readAt: { type: String, default: null, index: true }
  },
  { versionKey: false }
);

export const DirectMessage =
  mongoose.models.DirectMessage || mongoose.model('DirectMessage', DirectMessageSchema);
