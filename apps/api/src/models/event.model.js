import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true },
    summary: { type: String, default: '' },
    descriptionHtml: { type: String, default: '' },
    location: { type: String, default: '' },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published'],
      default: 'draft'
    },
    publishAt: { type: Date, default: null }
  },
  { timestamps: true }
);

EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ startAt: 1, endAt: 1 });

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
