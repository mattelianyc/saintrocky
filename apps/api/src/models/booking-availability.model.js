import mongoose from 'mongoose';

const AvailabilityWindowSchema = new mongoose.Schema(
  {
    startMinutes: { type: Number, required: true },
    endMinutes: { type: Number, required: true }
  },
  { _id: false }
);

const WeeklyRuleSchema = new mongoose.Schema(
  {
    dayOfWeek: { type: Number, required: true },
    startMinutes: { type: Number, required: true },
    endMinutes: { type: Number, required: true }
  },
  { _id: false }
);

const DateOverrideSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    isClosed: { type: Boolean, default: false },
    windows: { type: [AvailabilityWindowSchema], default: [] }
  },
  { _id: false }
);

const BookingAvailabilitySchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'BookingService', required: true },
    timezone: { type: String, default: 'UTC' },
    weeklyRules: { type: [WeeklyRuleSchema], default: [] },
    dateOverrides: { type: [DateOverrideSchema], default: [] },
    blackoutDates: { type: [Date], default: [] },
    updatedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

BookingAvailabilitySchema.index({ serviceId: 1 }, { unique: true });

export const BookingAvailability =
  mongoose.models.BookingAvailability ||
  mongoose.model('BookingAvailability', BookingAvailabilitySchema);
