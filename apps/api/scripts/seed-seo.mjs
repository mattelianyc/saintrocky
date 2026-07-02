import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { SeoSettings } from '@saintrocky/api/models/seo';

import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

export async function seedSeo() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();
  const siteUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:5173';

  await connectMongo(mongoUri);

  await SeoSettings.deleteMany({});

  await SeoSettings.create({
    siteName: 'Zero Start',
    defaultTitle: 'Zero Start',
    defaultDescription:
      'Zero Start helps teams launch faster with focused product, growth, SEO, and conversion work.',
    defaultOgImageUrl: `${siteUrl}/og/default.png`,
    defaultTwitterImageUrl: `${siteUrl}/og/default.png`,
    defaultCanonicalBase: siteUrl,
    robotsTxt: `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml`,
    structuredDataJson: JSON.stringify(
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Zero Start',
        url: siteUrl
      },
      null,
      2
    ),
    defaultLocale: 'en',
    hreflangLocales: ['en', 'es', 'fr', 'it', 'de', 'he'],
    routeOverrides: [
      {
        routeKey: 'home',
        routePath: '/',
        title: 'Zero Start | Build, Launch, Grow',
        description: 'Product, growth, SEO, and performance work for modern service brands.',
        canonicalUrl: siteUrl,
        ogImageUrl: `${siteUrl}/og/home.png`,
        twitterImageUrl: `${siteUrl}/og/home.png`,
        indexable: true,
        structuredDataJson: '',
        hreflang: [
          { locale: 'en', url: `${siteUrl}/` },
          { locale: 'es', url: `${siteUrl}/es` }
        ]
      },
      {
        routeKey: 'blog',
        routePath: '/blog',
        title: 'Zero Start Blog',
        description: 'Field notes on launch systems, SEO recovery, paid media, and performance.',
        canonicalUrl: `${siteUrl}/blog`,
        ogImageUrl: `${siteUrl}/og/blog.png`,
        twitterImageUrl: `${siteUrl}/og/blog.png`,
        indexable: true,
        structuredDataJson: '',
        hreflang: []
      },
      {
        routeKey: 'events',
        routePath: '/events',
        title: 'Zero Start Events',
        description: 'Workshops, clinics, and roundtables for product and growth operators.',
        canonicalUrl: `${siteUrl}/events`,
        ogImageUrl: `${siteUrl}/og/events.png`,
        twitterImageUrl: `${siteUrl}/og/events.png`,
        indexable: true,
        structuredDataJson: '',
        hreflang: []
      },
      {
        routeKey: 'booking',
        routePath: '/booking',
        title: 'Book a Strategy Session',
        description: 'Reserve a focused working session for launch, SEO, or conversion planning.',
        canonicalUrl: `${siteUrl}/booking`,
        ogImageUrl: `${siteUrl}/og/booking.png`,
        twitterImageUrl: `${siteUrl}/og/booking.png`,
        indexable: true,
        structuredDataJson: '',
        hreflang: []
      }
    ],
    updatedBy: 'seed@saintrocky.local'
  });

  await disconnectMongo();
  console.log('[seed] seo seeded');
}

runSeedScript(import.meta.url, seedSeo);
