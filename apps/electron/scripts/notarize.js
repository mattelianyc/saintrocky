import path from 'node:path';
import { existsSync } from 'node:fs';

import { notarize } from '@electron/notarize';

export default async function notarizeDesktopApplication(context) {
  const { electronPlatformName, appOutDir, packager } = context;

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appleId = process.env.APPLE_ID || '';
  const appleIdPassword = process.env.APPLE_ID_PASSWORD || '';
  const teamId = process.env.APPLE_TEAM_ID || '';

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn('[notarize] Skipping notarization because APPLE_ID, APPLE_ID_PASSWORD, or APPLE_TEAM_ID is missing.');
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  if (!existsSync(appPath)) {
    throw new Error(`[notarize] Cannot find signed app at ${appPath}.`);
  }

  await notarize({
    appBundleId: packager.appInfo.id,
    appPath,
    appleId,
    appleIdPassword,
    teamId
  });
}
