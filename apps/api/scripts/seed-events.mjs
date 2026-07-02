import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { Event } from '@saintrocky/api/models/event';

import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

function daysFromNow(days, hour, minute = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

export async function seedEvents() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();

  await connectMongo(mongoUri);

  await Event.deleteMany({});

  await Event.insertMany([
    {
      title: 'Zero Start Launch Clinic',
      slug: 'zero-start-launch-clinic',
      summary: 'A practical session on launches, funnels, and first-week analytics.',
      descriptionHtml:
        '<p>A live clinic for founders preparing a launch across product, content, and acquisition.</p>',
      location: 'Remote',
      startAt: daysFromNow(3, 17),
      endAt: daysFromNow(3, 18, 30),
      timezone: 'UTC',
      status: 'published',
      publishAt: daysFromNow(-4, 12)
    },
    {
      title: 'SEO Recovery Workshop',
      slug: 'seo-recovery-workshop',
      summary: 'How to diagnose rankings loss after redesigns and migrations.',
      descriptionHtml:
        '<p>We walk through technical triage, content repair, and measurement priorities.</p>',
      location: 'Remote',
      startAt: daysFromNow(10, 16),
      endAt: daysFromNow(10, 17, 30),
      timezone: 'UTC',
      status: 'published',
      publishAt: daysFromNow(-7, 9)
    },
    {
      title: 'Growth Operators Roundtable',
      slug: 'growth-operators-roundtable',
      summary: 'An invite-only discussion on demand capture, positioning, and reporting.',
      descriptionHtml:
        '<p>A moderated roundtable for operators aligning paid, owned, and conversion work.</p>',
      location: 'Brooklyn, NY',
      startAt: daysFromNow(18, 23),
      endAt: daysFromNow(19, 1),
      timezone: 'America/New_York',
      status: 'scheduled',
      publishAt: daysFromNow(5, 14)
    },
    {
      title: 'Content Systems for AI Search',
      slug: 'content-systems-for-ai-search',
      summary: 'Build a content engine that serves both classic and AI-driven discovery.',
      descriptionHtml:
        '<p>We cover topic clusters, schema, and publishing workflows that compound over time.</p>',
      location: 'Remote',
      startAt: daysFromNow(28, 15),
      endAt: daysFromNow(28, 16, 30),
      timezone: 'UTC',
      status: 'draft',
      publishAt: null
    },
    {
      title: 'Performance and Conversion Intensive',
      slug: 'performance-and-conversion-intensive',
      summary: 'A hands-on teardown of site speed, message clarity, and funnel friction.',
      descriptionHtml:
        '<p>Review Core Web Vitals, landing page hierarchy, and experiment design.</p>',
      location: 'Austin, TX',
      startAt: daysFromNow(-12, 18),
      endAt: daysFromNow(-12, 20),
      timezone: 'America/Chicago',
      status: 'published',
      publishAt: daysFromNow(-20, 10)
    }
  ]);

  await disconnectMongo();
  console.log('[seed] events seeded');
}

runSeedScript(import.meta.url, seedEvents);
