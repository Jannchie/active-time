import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

type ProcessEntry = {
  name: string;
  seconds: number;
};

export type ProcessStats = {
  name: string;
  seconds: number;
  count: number;
};

const parseEtime = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  const [dayPart, timePartRaw] = trimmed.includes('-')
    ? (trimmed.split('-') as [string, string])
    : [null, trimmed];
  const days = dayPart ? Number(dayPart) : 0;
  const timePart = timePartRaw ?? trimmed;
  const parts = timePart.split(':').map((item) => Number(item));
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    seconds = parts[0];
  }
  return days * 86400 + seconds;
};

const parseWmiDate = (value: string) => {
  const trimmed = value.trim();
  const jsonDateMatch = /^\/Date\((\d+)([+-]\d{4})?\)\/$/.exec(trimmed);
  if (jsonDateMatch) {
    const ms = Number(jsonDateMatch[1]);
    if (!Number.isFinite(ms)) {
      return null;
    }
    return ms;
  }
  const match =
    /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.\d+([+-]\d{3})$/.exec(
      trimmed
    );
  if (!match) {
    return null;
  }
  const [, year, month, day, hour, minute, second, offset] = match;
  const offsetMinutes = Number(offset);
  const utcMs =
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    ) - offsetMinutes * 60 * 1000;
  return utcMs;
};

const listWindows = async (): Promise<ProcessEntry[]> => {
  const command =
    'Get-CimInstance Win32_Process | Select-Object ProcessId, Name, CreationDate | ConvertTo-Json -Compress';
  const { stdout } = await execFileAsync('powershell', ['-NoProfile', '-Command', command], {
    encoding: 'utf8',
    windowsHide: true,
  });
  const raw = stdout.trim();
  if (!raw) {
    return [];
  }
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const list = Array.isArray(data) ? data : [data];
  const now = Date.now();
  return list
    .map((item) => {
      const startedAt = item?.CreationDate
        ? parseWmiDate(String(item.CreationDate))
        : null;
      if (!startedAt) {
        return null;
      }
      const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
      return {
        name: String(item?.Name ?? ''),
        seconds,
      };
    })
    .filter(
      (item): item is ProcessEntry =>
        Boolean(item && item.name && Number.isFinite(item.seconds))
    );
};

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
      encoding: 'utf8',
      windowsHide: true,
    }
  );
  return parseTasklistNames(stdout);
};

const parsePsSeconds = (stdout: string) => {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(\d+)\s+(\S+)\s+(\d+)$/.exec(line);
      if (!match) {
        return null;
      }
      return {
        name: match[2],
        seconds: Number(match[3]),
      };
    })
    .filter(
      (item): item is ProcessEntry =>
        Boolean(item && item.name && Number.isFinite(item.seconds))
    );
};

const parsePsEtime = (stdout: string) => {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(\d+)\s+(\S+)\s+(.+)$/.exec(line);
      if (!match) {
        return null;
      }
      return {
        name: match[2],
        seconds: parseEtime(match[3]),
      };
    })
    .filter(
      (item): item is ProcessEntry =>
        Boolean(item && item.name && Number.isFinite(item.seconds))
    );
};

const listUnix = async (): Promise<ProcessEntry[]> => {
  const { stdout } = await execFileAsync(
    'ps',
    ['-eo', 'pid=,comm=,etimes='],
    { encoding: 'utf8' }
  );
  return parsePsSeconds(stdout);
};

const listDarwin = async (): Promise<ProcessEntry[]> => {
  const { stdout } = await execFileAsync('ps', ['-eo', 'pid=,comm=,etime='], {
    encoding: 'utf8',
  });
  return parsePsEtime(stdout);
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

const aggregateStats = (entries: ProcessEntry[]): ProcessStats[] => {
  const totals = new Map<string, ProcessStats>();
  for (const entry of entries) {
    if (!entry.name) {
      continue;
    }
    const existing = totals.get(entry.name);
    if (existing) {
      existing.seconds += entry.seconds;
      existing.count += 1;
    } else {
      totals.set(entry.name, {
        name: entry.name,
        seconds: entry.seconds,
        count: 1,
      });
    }
  }
  return [...totals.values()].sort((a, b) => b.seconds - a.seconds);
};

export const listRunningProcessStats = async (): Promise<ProcessStats[]> => {
  try {
    if (process.platform === 'win32') {
      return aggregateStats(await listWindows());
    }
    if (process.platform === 'darwin') {
      return aggregateStats(await listDarwin());
    }
    return aggregateStats(await listUnix());
  } catch {
    return [];
  }
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
