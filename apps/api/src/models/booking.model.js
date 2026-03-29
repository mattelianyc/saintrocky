import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookingService', required: true },
    serviceName: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    notes: { type: String, default: '' },
    priceCents: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    requiresPayment: { type: Boolean, default: false },
    source: { type: String, default: 'public' }
  },
  { timestamps: true }
);

BookingSchema.index({ serviceId: 1, startAt: 1 });
BookingSchema.index({ customerEmail: 1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
