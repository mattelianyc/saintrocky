import mongoose from 'mongoose';

const ContactInquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'archived'],
      default: 'new'
    },
    internalNotes: { type: String, default: '' }
  },
  { timestamps: true }
);

ContactInquirySchema.index({ status: 1, createdAt: -1 });

export const ContactInquiry =
  mongoose.models.ContactInquiry || mongoose.model('ContactInquiry', ContactInquirySchema);
