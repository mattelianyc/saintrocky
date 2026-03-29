import mongoose from 'mongoose';

const BookingServiceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true },
    timezone: { type: String, default: 'UTC' },
    durationMinutes: { type: Number, default: 30 },
    stepMinutes: { type: Number, default: 30 },
    bufferMinutes: { type: Number, default: 0 },
    minimumNoticeMinutes: { type: Number, default: 0 },
    bookingWindowDays: { type: Number, default: 60 },
    priceCents: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    requiresPayment: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const BookingService =
  mongoose.models.BookingService || mongoose.model('BookingService', BookingServiceSchema);
