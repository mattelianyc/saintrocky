import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function normalizeProcessName(value) {
  return path.basename(String(value || '').trim()).toLowerCase();
}

function parseTaskListCsv(stdout) {
  return String(stdout || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^"([^"]+)"/);
      return normalizeProcessName(match?.[1] || '');
    })
    .filter(Boolean);
}

export async function listVisibleProcesses() {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execFileAsync('tasklist', ['/FO', 'CSV', '/NH']);
      return [...new Set(parseTaskListCsv(stdout))];
    }

    const { stdout } = await execFileAsync('ps', ['-axo', 'comm=']);
    return [
      ...new Set(
        String(stdout || '')
          .split('\n')
          .map((line) => normalizeProcessName(line))
          .filter(Boolean)
      )
    ];
  } catch {
    return [];
  }
}

export async function getFocusedApplicationName() {
  if (process.platform !== 'darwin') {
    return '';
  }

  try {
    const { stdout } = await execFileAsync('osascript', [
      '-e',
      'tell application "System Events" to get name of first application process whose frontmost is true'
    ]);
    return normalizeProcessName(stdout);
  } catch {
    return '';
  }
}

export function findMatchingProcessNames(processNames = [], candidates = []) {
  const normalizedProcessNames = processNames.map(normalizeProcessName);
  const normalizedCandidates = candidates.map(normalizeProcessName);

  return normalizedCandidates.filter((candidate) =>
    normalizedProcessNames.some(
      (processName) => processName === candidate || processName.includes(candidate) || candidate.includes(processName)
    )
  );
}
