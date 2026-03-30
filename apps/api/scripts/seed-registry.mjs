import { seedBlog } from './seed-blog.mjs';
import { seedBooking } from './seed-booking.mjs';
import { seedContact } from './seed-contact.mjs';
import { seedEvents } from './seed-events.mjs';
import { seedRules } from './seed-rules.mjs';
import { seedSocial } from './seed-social.mjs';
import { seedSeo } from './seed-seo.mjs';
import { seedUsers } from './seed-users.mjs';
import { seedWallets } from './seed-wallets.mjs';

export const seedDefinitions = [
  { name: 'users', run: seedUsers },
  { name: 'rules', run: seedRules },
  { name: 'wallets', run: seedWallets },
  { name: 'social', run: seedSocial },
  { name: 'blog', run: seedBlog },
  { name: 'booking', run: seedBooking },
  { name: 'contact', run: seedContact },
  { name: 'events', run: seedEvents },
  { name: 'seo', run: seedSeo }
];

export function getSeedNames() {
  return seedDefinitions.map((definition) => definition.name);
}
