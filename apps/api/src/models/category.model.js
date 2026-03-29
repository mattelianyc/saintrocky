import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
