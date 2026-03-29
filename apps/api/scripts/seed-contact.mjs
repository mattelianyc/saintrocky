import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { ContactInquiry } from '@saintrocky/api/models/contact-inquiry';

import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

export async function seedContact() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();

  await connectMongo(mongoUri);

  await ContactInquiry.deleteMany({});

  await ContactInquiry.insertMany([
    {
      name: 'Nina Patel',
      email: 'nina@anchorpeakhealth.com',
      subject: 'Need a full site rebuild',
      message:
        'We need a modern marketing site, booking flow, and cleaner analytics before our summer launch.',
      status: 'new',
      internalNotes: 'High-intent healthcare lead from referral partner.'
    },
    {
      name: 'Marcus Lee',
      email: 'marcus@hinterlandmedia.io',
      subject: 'SEO traffic dropped after redesign',
      message:
        'Our organic traffic slid after a recent redesign and we need a technical + content recovery plan.',
      status: 'read',
      internalNotes: 'Asked for a teardown call and migration audit.'
    },
    {
      name: 'Claire Dubois',
      email: 'claire@ateliermeridian.fr',
      subject: 'French localization support',
      message:
        'We are expanding to French-speaking markets and want localized landing pages with analytics.',
      status: 'replied',
      internalNotes: 'Sent proposal draft and timeline.'
    },
    {
      name: 'Owen Carter',
      email: 'owen@northfoundry.co',
      subject: 'Paid media sprint',
      message:
        'Looking for a short sprint to validate paid search and paid social before a larger retainer.',
      status: 'new',
      internalNotes: 'Possible fit for growth sprint planning service.'
    },
    {
      name: 'Ava Richardson',
      email: 'ava@mapleridgelegal.com',
      subject: 'Need better lead quality',
      message:
        'We get plenty of form fills but too many are unqualified. We need a smarter funnel and messaging.',
      status: 'archived',
      internalNotes: 'Closed lost. Budget mismatch.'
    },
    {
      name: 'Leo Schmidt',
      email: 'leo@solsticeops.de',
      subject: 'Platform migration planning',
      message:
        'Planning a migration to a new front end and want to protect SEO while improving page performance.',
      status: 'read',
      internalNotes: 'Strong fit for SEO recovery teardown plus implementation phase.'
    }
  ]);

  await disconnectMongo();
  console.log('[seed] contact seeded: inquiries');
}

runSeedScript(import.meta.url, seedContact);
