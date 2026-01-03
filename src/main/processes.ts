let activeWindow: any = null;
try {
  const activeWindowModule = require('@jannchie/active-window');
  activeWindow = activeWindowModule?.default ?? activeWindowModule;
} catch {
  activeWindow = null;
}

export const listRunningProcessNames = async (): Promise<string[]> => {
  const fn = activeWindow?.listRunningProcessNames;
  if (typeof fn !== 'function') {
    return [];
  }
  try {
    const result = await fn();
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
};

export const listWindowsProcessPaths = async (): Promise<Map<string, string>> => {
  if (process.platform !== 'win32') {
    return new Map();
  }
  const fn = activeWindow?.listWindowsProcessPaths;
  if (typeof fn !== 'function') {
    return new Map();
  }
  try {
    const result = await fn();
    return result instanceof Map ? result : new Map();
  } catch {
    return new Map();
  }
};

export const getWindowsProcessNameByPid = async (
  pid: number
): Promise<string> => {
  if (process.platform !== 'win32') {
    return '';
  }
  const fn = activeWindow?.getWindowsProcessNameByPid;
  if (typeof fn !== 'function') {
    return '';
  }
  try {
    const result = await fn(pid);
    return typeof result === 'string' ? result : '';
  } catch {
    return '';
  }
};
