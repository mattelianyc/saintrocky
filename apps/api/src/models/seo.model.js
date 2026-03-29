import mongoose from 'mongoose';

const LocaleSchema = new mongoose.Schema(
  {
    locale: { type: String, required: true },
    url: { type: String, required: true }
  },
  { _id: false }
);

const RouteOverrideSchema = new mongoose.Schema(
  {
    routeKey: { type: String, required: true },
    routePath: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    canonicalUrl: { type: String, default: '' },
    ogImageUrl: { type: String, default: '' },
    twitterImageUrl: { type: String, default: '' },
    indexable: { type: Boolean, default: true },
    structuredDataJson: { type: String, default: '' },
    hreflang: { type: [LocaleSchema], default: [] }
  },
  { _id: false }
);

const SeoSettingsSchema = new mongoose.Schema(
  {
    siteName: { type: String, default: '' },
    defaultTitle: { type: String, default: '' },
    defaultDescription: { type: String, default: '' },
    defaultOgImageUrl: { type: String, default: '' },
    defaultTwitterImageUrl: { type: String, default: '' },
    defaultCanonicalBase: { type: String, default: '' },
    robotsTxt: { type: String, default: 'User-agent: *\nAllow: /' },
    structuredDataJson: { type: String, default: '' },
    defaultLocale: { type: String, default: 'en' },
    hreflangLocales: {
      type: [String],
      default: ['en', 'es', 'fr', 'it', 'de', 'he']
    },
    routeOverrides: { type: [RouteOverrideSchema], default: [] },
    updatedBy: { type: String, default: '' }
  },
  { timestamps: true }
);

export const SeoSettings =
  mongoose.models.SeoSettings || mongoose.model('SeoSettings', SeoSettingsSchema);
