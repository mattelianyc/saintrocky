import mongoose from 'mongoose';

const TranslationOverrideSchema = new mongoose.Schema(
  {
    locale: { type: String, required: true },
    url: { type: String, required: true }
  },
  { _id: false }
);

const SeoSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    ogTitle: { type: String, default: '' },
    ogDescription: { type: String, default: '' },
    ogImageUrl: { type: String, default: '' },
    twitterImageUrl: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    indexable: { type: Boolean, default: true },
    structuredDataJson: { type: String, default: '' },
    hreflangOverrides: { type: [TranslationOverrideSchema], default: [] }
  },
  { _id: false }
);

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    excerpt: { type: String, default: '' },
    contentHtml: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published'],
      default: 'draft'
    },
    publishAt: { type: Date, default: null },
    language: { type: String, default: 'en' },
    translationKey: { type: String, default: '' },
    tags: { type: [String], default: [] },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', default: null },
    categoryIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'Category', default: [] },
    coverImageUrl: { type: String, default: '' },
    coverImageAlt: { type: String, default: '' },
    seo: { type: SeoSchema, default: () => ({}) }
  },
  { timestamps: true }
);

PostSchema.index({ slug: 1, language: 1 }, { unique: true });

export const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);
