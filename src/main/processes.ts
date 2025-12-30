import { execFile } from 'child_process';
import { promisify } from 'util';
import { autoDecodeText } from './util';

const execFileAsync = promisify(execFile);

const parseTasklistNames = (stdout: string) => {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith('"')) {
        const trimmed = line.length >= 2 ? line.slice(1, -1) : line;
        const [name] = trimmed.split('","');
        return name;
      }
      return line.split(/\s+/)[0];
    })
    .filter(Boolean);
};

const listWindowsNames = async (): Promise<string[]> => {
  const { stdout } = await execFileAsync(
    'tasklist',
    ['/FO', 'CSV', '/NH'],
    {
      encoding: 'buffer',
      windowsHide: true,
    }
  );
  const decoded = autoDecodeText(stdout);
  if (!decoded) {
    return [];
  }
  return parseTasklistNames(decoded);
};

const parseWmicProcessPaths = (stdout: string) => {
  const map = new Map<string, string>();
  let name = '';
  let path = '';
  const flush = () => {
    if (name && path && !map.has(name)) {
      map.set(name, path);
    }
    name = '';
    path = '';
  };
  stdout.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flush();
      return;
    }
    const [keyRaw, ...rest] = trimmed.split('=');
    if (!keyRaw) {
      return;
    }
    const key = keyRaw.trim().toLowerCase();
    const value = rest.join('=').trim();
    if (key === 'name') {
      name = value;
    } else if (key === 'executablepath') {
      path = value;
    }
  });
  flush();
  return map;
};

export const listWindowsProcessPaths = async (): Promise<Map<string, string>> => {
  const { stdout } = await execFileAsync(
    'wmic',
    ['process', 'get', 'Name,ExecutablePath', '/VALUE'],
    {
      encoding: 'buffer',
      windowsHide: true,
    }
  );
  const decoded = autoDecodeText(stdout) ?? '';
  if (!decoded) {
    return new Map();
  }
  return parseWmicProcessPaths(decoded);
};

const listUnixNames = async (): Promise<string[]> => {
  const { stdout } = await execFileAsync('ps', ['-A', '-o', 'comm='], {
    encoding: 'utf8',
  });
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const listDarwinNames = async (): Promise<string[]> => {
  return listUnixNames();
};

export const listRunningProcessNames = async (): Promise<string[]> => {
  try {
    let names: string[];
    if (process.platform === 'win32') {
      names = await listWindowsNames();
    } else if (process.platform === 'darwin') {
      names = await listDarwinNames();
    } else {
      names = await listUnixNames();
    }
    return [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  } catch {
    return [];
  }
};
