export const useElectron = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.electron?.ipcRenderer ?? null;
};
