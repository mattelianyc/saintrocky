import { seedDefinitions, getSeedNames } from './seed-registry.mjs';
import { loadSeedEnvironment, parseOmitNames } from './seed-support.mjs';

async function seedAll() {
  loadSeedEnvironment();

  const omittedNames = parseOmitNames();
  const availableSeedNames = new Set(getSeedNames());
  const unknownNames = [...omittedNames].filter((name) => !availableSeedNames.has(name));

  if (unknownNames.length > 0) {
    throw new Error(
      `Unknown seed names in --omit: ${unknownNames.join(', ')}. Available: ${getSeedNames().join(', ')}`
    );
  }

  const selectedSeedDefinitions = seedDefinitions.filter(
    (definition) => !omittedNames.has(definition.name)
  );

  console.log(
    `[seed] running seeders: ${selectedSeedDefinitions.map((definition) => definition.name).join(', ')}`
  );

  for (const definition of selectedSeedDefinitions) {
    await definition.run();
  }

  console.log('[seed] all seeders completed');
}

seedAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
