import bcrypt from 'bcryptjs';

import { connectMongo, disconnectMongo } from '@saintrocky/api/db/mongo';
import { User } from '@saintrocky/api/models/user';
import { loadSeedEnvironment, requireMongoUri, runSeedScript } from './seed-support.mjs';

// Deduplicated by localPart and name: if either is duplicated, only the first instance is kept
const seenNames = new Set();
const seenLocalParts = new Set();
const baseUsersSeed = [
  { name: 'Lena Brooks', role: 'member', localPart: 'lb' },
  { name: 'Miles Carter', role: 'member', localPart: 'mc' },
  { name: 'Camila Flores', role: 'member', localPart: 'cf' },
  { name: 'Devon Miles', role: 'member', localPart: 'dm' },
  { name: 'Elise Turner', role: 'member', localPart: 'et' },
  { name: 'Farah Hassan', role: 'member', localPart: 'fh' },
  { name: 'Gabriel Ross', role: 'member', localPart: 'gr' },
  { name: 'Hana Kim', role: 'member', localPart: 'hk' },
  { name: 'Isaac Moreno', role: 'member', localPart: 'im' },
  { name: 'Jules Walker', role: 'member', localPart: 'jw' },
  { name: 'Keira Patel', role: 'member', localPart: 'kp' },
  { name: 'Logan Price', role: 'member', localPart: 'lp' },
  { name: 'Alina Park', role: 'member', localPart: 'ap' },
  { name: 'Ben Carter', role: 'member', localPart: 'bc' },
  { name: 'Nina Delgado', role: 'member', localPart: 'nd' },
  { name: 'Owen Mercer', role: 'member', localPart: 'om' },
  { name: 'Parker Reed', role: 'member', localPart: 'pr' },
  { name: 'Quinn Foster', role: 'member', localPart: 'qf' },
  { name: 'Rhea Banerjee', role: 'member', localPart: 'rb' },
  { name: 'Soren Blake', role: 'member', localPart: 'sb' },
  { name: 'Talia Nguyen', role: 'member', localPart: 'tn' },
  { name: 'Uma Reyes', role: 'member', localPart: 'ur' },
  { name: 'Victor Chen', role: 'member', localPart: 'vc' },
  { name: 'Willow Hayes', role: 'member', localPart: 'wh' },
  { name: 'Xavier Cole', role: 'member', localPart: 'xc' },
  { name: 'Yara Haddad', role: 'member', localPart: 'yh' },
  { name: 'Zane Holloway', role: 'member', localPart: 'zh' },
  { name: 'Ari Sutton', role: 'member', localPart: 'as' },
  { name: 'Bianca Lowe', role: 'member', localPart: 'bl' },
  { name: 'Cory Maddox', role: 'member', localPart: 'cm' },
  { name: 'Dahlia Stone', role: 'member', localPart: 'ds' },
  { name: 'Evan Bishop', role: 'member', localPart: 'eb' },
  { name: 'Freya Olsen', role: 'member', localPart: 'fo' },
  { name: 'Griffin Shaw', role: 'member', localPart: 'gs' },
  { name: 'Harper Quinn', role: 'member', localPart: 'hq' },
  { name: 'Ivy Monroe', role: 'member', localPart: 'im' },
  { name: 'Jonah Pierce', role: 'member', localPart: 'jp' },
  { name: 'ME', role: 'owner', localPart: 'me' },
  { name: 'Dog the Bounty Hunter', role: 'admin', localPart: 'db' },
  { name: 'Priya Shah', role: 'manager', localPart: 'ps' },
  { name: 'Noah Bennett', role: 'operator', localPart: 'nb' },
  { name: 'Jordan Alvarez', role: 'editor', localPart: 'ja' }
];

const usersSeed = [];
for (const entry of baseUsersSeed) {
  if (seenNames.has(entry.name) || seenLocalParts.has(entry.localPart)) continue;
  seenNames.add(entry.name);
  seenLocalParts.add(entry.localPart);
  usersSeed.push(entry);
}


export async function seedUsers() {
  loadSeedEnvironment();
  const mongoUri = requireMongoUri();
  const seedDomain = process.env.SEED_DOMAIN || 'st.dev';
  const seedPassword = process.env.SEED_PASSWORD || 'fmldnr';

  await connectMongo(mongoUri);

  await User.deleteMany({});

  const passwordHash = await bcrypt.hash(seedPassword, 10);

  for (const userSeed of usersSeed) {
    await User.create({
      name: userSeed.name,
      email: `${userSeed.localPart}@${seedDomain}`,
      passwordHash,
      role: userSeed.role
    });
  }

  await disconnectMongo();
  const roleCounts = usersSeed.reduce((counts, entry) => {
    counts[entry.role] = (counts[entry.role] || 0) + 1;
    return counts;
  }, {});
  const summary = Object.entries(roleCounts)
    .map(([role, count]) => `${role}=${count}`)
    .join(', ');
  console.log(`[seed] users seeded: ${summary}`);
}

runSeedScript(import.meta.url, seedUsers);
