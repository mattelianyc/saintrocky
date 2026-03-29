#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

function usage() {
  console.log('Usage: yarn add:pkg <workspaceNameOrPath> <package> [morePackages...]');
  console.log('Examples:');
  console.log('  yarn add:pkg @saintrocky/web lodash');
  console.log('  yarn add:pkg apps/web lodash');
  process.exit(1);
}

const [, , workspaceArg, ...pkgs] = process.argv;
if (!workspaceArg || pkgs.length === 0) usage();

const workspaceMap = {
  'apps/web': '@saintrocky/web',
  'apps/api': '@saintrocky/api',
  'apps/mobile': '@saintrocky/mobile',
  'packages/shared': '@saintrocky/shared',
  'packages/ui': '@saintrocky/ui',
  'packages/api-client': '@saintrocky/api-client'
};

const workspaceName = workspaceMap[workspaceArg] || workspaceArg;

const res = spawnSync('yarn', ['workspace', workspaceName, 'add', ...pkgs], {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

process.exit(res.status ?? 1);


